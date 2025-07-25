import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface YouTubeVideoProps {
  url: string;
  title?: string;
  onClose?: () => void;
  timeCode?: string; // Формат: "1:25" или "01:25"
}

const { width, height } = Dimensions.get('window');

const YouTubeVideo: React.FC<YouTubeVideoProps> = ({ url, title, onClose, timeCode }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Функция для извлечения ID видео из YouTube URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Функция для конвертации таймкода в секунды
  const timeCodeToSeconds = (timeCode: string): number => {
    const parts = timeCode.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  // Функция для форматирования таймкода для YouTube
  const formatTimeCodeForYouTube = (timeCode: string): string => {
    const seconds = timeCodeToSeconds(timeCode);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m${remainingSeconds.toString().padStart(2, '0')}s`;
  };

  const videoId = getYouTubeVideoId(url);
  const timeCodeParam = timeCode ? `&start=${timeCodeToSeconds(timeCode)}` : '';

  if (!videoId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF4444" />
        <Text style={styles.errorText}>Неверная ссылка на YouTube</Text>
      </View>
    );
  }

  // Создаем HTML для встроенного YouTube плеера
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .video-container {
            width: 100%;
            height: 100%;
            position: relative;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <div class="video-container">
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1${timeCodeParam}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title || 'Мой момент'}
          {timeCode ? ` (${timeCode})` : ''}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsFullscreen(!isFullscreen)}
          >
            <Ionicons 
              name={isFullscreen ? "contract" : "expand"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Видео плеер */}
      <View style={styles.videoContainer}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.3)',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    flex: 1,
    marginRight: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default YouTubeVideo; 