import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YouTubeVideo from './YouTubeVideo';

interface VideoCarouselProps {
  videos: Array<{ url: string; timeCode?: string }>;
  onVideoPress?: (video: { url: string; timeCode?: string }) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function VideoCarousel({ videos, onVideoPress }: VideoCarouselProps) {
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; timeCode?: string } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const getYouTubeThumbnail = (url: string): string => {
    // Извлекаем video ID из YouTube URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return 'https://via.placeholder.com/300x200/333/666?text=Video';
  };

  const handleVideoPress = (video: { url: string; timeCode?: string }) => {
    if (onVideoPress) {
      onVideoPress(video);
    } else {
      setSelectedVideo(video);
    }
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  if (!videos || videos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>Нет добавленных видео</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Индикатор карусели */}
      {videos.length > 1 && (
        <View style={styles.carouselIndicator}>
          <Ionicons name="chevron-back" size={20} color="#FF4444" />
          <Ionicons name="chevron-forward" size={20} color="#FF4444" />
        </View>
      )}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={(event) => {
          const contentOffset = event.nativeEvent.contentOffset.x;
          const cardWidth = screenWidth * 0.65 + 16; // ширина карточки + отступы
          const newIndex = Math.round(contentOffset / cardWidth);
          setCurrentIndex(newIndex);
        }}
        scrollEventThrottle={16}
      >
        {videos.map((video, index) => (
          <TouchableOpacity
            key={index}
            style={styles.videoCard}
            onPress={() => handleVideoPress(video)}
          >
            <Image
              source={{ uri: getYouTubeThumbnail(video.url) }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.playButton}>
              <Ionicons name="play-circle" size={40} color="#FF4444" />
            </View>
            {video.timeCode && (
              <View style={styles.timeCodeBadge}>
                <Text style={styles.timeCodeText}>{video.timeCode}</Text>
              </View>
            )}
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>Момент {index + 1}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Точки-индикаторы */}
      {videos.length > 1 && (
        <View style={styles.dotsContainer}>
          {videos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot
              ]}
            />
          ))}
        </View>
      )}

      {/* Модальное окно для просмотра видео */}
      <Modal
        visible={selectedVideo !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {selectedVideo && (
              <YouTubeVideo
                videoUrl={selectedVideo.url}
                timeCode={selectedVideo.timeCode}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 5,
  },
  videoCard: {
    width: screenWidth * 0.65,
    height: 180,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
  },
  timeCodeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeCodeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Gilroy-Bold',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '60%',
    backgroundColor: '#000',
    borderRadius: 12,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  carouselIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 20,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF4444',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
}); 