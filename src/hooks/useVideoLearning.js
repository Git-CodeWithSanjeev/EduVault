import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for video learning progress, bookmarks, likes, saves, and history.
 * Persists data to localStorage with instant UI synchronization.
 */
export function useVideoLearning() {
  const [completedMap, setCompletedMap] = useLocalStorage('eduvault-video-completed', {});
  const [likedVideos, setLikedVideos] = useLocalStorage('eduvault-video-likes', []);
  const [bookmarkedVideos, setBookmarkedVideos] = useLocalStorage('eduvault-video-bookmarks', []);
  const [savedVideos, setSavedVideos] = useLocalStorage('eduvault-video-saved', []);
  const [learningList, setLearningList] = useLocalStorage('eduvault-video-learning-list', []);

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
