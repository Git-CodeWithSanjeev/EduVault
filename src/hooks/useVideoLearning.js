import { useState, useEffect } from 'react';

/**
 * Custom hook for video learning progress, bookmarks, likes, saves, and history.
 * Persists data to localStorage with instant UI synchronization.
 */
export function useVideoLearning() {
  // Completed lessons by video ID: { [videoId]: [lessonIndex1, lessonIndex2] }
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eduvault-video-completed') || '{}');
    } catch {
      return {};
    }
  });

  // Liked videos array
  const [likedVideos, setLikedVideos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eduvault-video-likes') || '[]');
    } catch {
      return [];
    }
  });

  // Bookmarked videos array
  const [bookmarkedVideos, setBookmarkedVideos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eduvault-video-bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  // Saved videos array
  const [savedVideos, setSavedVideos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eduvault-video-saved') || '[]');
    } catch {
      return [];
    }
  });

  // Learning list array
  const [learningList, setLearningList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eduvault-video-learning-list') || '[]');
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('eduvault-video-completed', JSON.stringify(completedMap));
  }, [completedMap]);

  useEffect(() => {
    localStorage.setItem('eduvault-video-likes', JSON.stringify(likedVideos));
  }, [likedVideos]);

  useEffect(() => {
    localStorage.setItem('eduvault-video-bookmarks', JSON.stringify(bookmarkedVideos));
  }, [bookmarkedVideos]);

  useEffect(() => {
    localStorage.setItem('eduvault-video-saved', JSON.stringify(savedVideos));
  }, [savedVideos]);

  useEffect(() => {
    localStorage.setItem('eduvault-video-learning-list', JSON.stringify(learningList));
  }, [learningList]);

  // Actions
  const isLessonCompleted = (videoId, lessonIdx) => {
    if (!videoId) return false;
    const list = completedMap[videoId] || [];
    return list.includes(lessonIdx);
  };

  const toggleLessonCompleted = (videoId, lessonIdx) => {
    if (!videoId) return;
    setCompletedMap((prev) => {
      const currentList = prev[videoId] || [];
      const updated = currentList.includes(lessonIdx)
        ? currentList.filter((idx) => idx !== lessonIdx)
        : [...currentList, lessonIdx];
      return { ...prev, [videoId]: updated };
    });
  };

  const getCourseProgress = (videoId, totalLessonsCount) => {
    if (!videoId || !totalLessonsCount || totalLessonsCount === 0) return 0;
    const completedCount = (completedMap[videoId] || []).length;
    return Math.min(100, Math.round((completedCount / totalLessonsCount) * 100));
  };

  const isLiked = (videoId) => likedVideos.includes(videoId);
  const toggleLike = (videoId) => {
    if (!videoId) return;
    setLikedVideos((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const isBookmarked = (videoId) => bookmarkedVideos.includes(videoId);
  const toggleBookmark = (videoId) => {
    if (!videoId) return;
    setBookmarkedVideos((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const isSaved = (videoId) => savedVideos.includes(videoId);
  const toggleSave = (videoId) => {
    if (!videoId) return;
    setSavedVideos((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const isInLearningList = (videoId) => learningList.includes(videoId);
  const toggleLearningList = (videoId) => {
    if (!videoId) return;
    setLearningList((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  return {
    completedMap,
    likedVideos,
    bookmarkedVideos,
    savedVideos,
    learningList,
    isLessonCompleted,
    toggleLessonCompleted,
    getCourseProgress,
    isLiked,
    toggleLike,
    isBookmarked,
    toggleBookmark,
    isSaved,
    toggleSave,
    isInLearningList,
    toggleLearningList,
  };
}
