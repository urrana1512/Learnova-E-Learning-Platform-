import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ─── Courses ──────────────────────────────────────────────────────────────────
export const courseAPI = {
  list: () => api.get('/courses'),
  listPublic: () => api.get('/courses/public'),
  create: (data) => api.post('/courses', data),
  get: (id) => api.get(`/courses/${id}`),
  getDetail: (id) => api.get(`/courses/${id}/detail`),
  update: (id, data) => api.put(`/courses/${id}`, data),
  updateForm: (id, formData) => api.put(`/courses/${id}`, formData),
  delete: (id) => api.delete(`/courses/${id}`),
  togglePublish: (id) => api.put(`/courses/${id}/publish`),
}

// ─── Lessons ──────────────────────────────────────────────────────────────────
export const lessonAPI = {
  list: (courseId) => api.get(`/courses/${courseId}/lessons`),
  create: (courseId, formData) => api.post(`/courses/${courseId}/lessons`, formData),
  update: (id, formData) => api.put(`/lessons/${id}`, formData),
  delete: (id) => api.delete(`/lessons/${id}`),
  getQuiz: (id) => api.get(`/lessons/${id}/quiz`),
  addAttachment: (id, data) => api.post(`/lessons/${id}/attachments`, data),
  deleteAttachment: (id, attachmentId) => api.delete(`/lessons/${id}/attachments/${attachmentId}`),
}

// ─── Admin Users ──────────────────────────────────────────────────────────────
export const adminUsersAPI = {
  list: () => api.get('/users'),
  toggleStatus: (id, data) => api.patch(`/users/${id}/toggle-status`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizAPI = {
  list: (courseId) => api.get(`/courses/${courseId}/quizzes`),
  create: (courseId, data) => api.post(`/quizzes`, { ...data, courseId }),
  get: (id) => api.get(`/quizzes/${id}`),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  addQuestion: (id, data) => api.post(`/quizzes/${id}/questions`, data),
  updateQuestion: (id, questionId, data) => api.put(`/quizzes/${id}/questions/${questionId}`, data),
  deleteQuestion: (id, questionId) => api.delete(`/quizzes/${id}/questions/${questionId}`),
  updateRewards: (id, data) => api.put(`/quizzes/${id}/rewards`, data),
  submitAttempt: (id, data) => api.post(`/quizzes/${id}/attempt`, data),
}

// ─── Enrollments ──────────────────────────────────────────────────────────────
export const enrollmentAPI = {
  enroll: (courseId, simulated = false) => api.post('/enrollments', { courseId, simulated }),
  myEnrollments: () => api.get('/enrollments/my'),
  complete: (courseId) => api.put(`/enrollments/${courseId}/complete`),
  updateTime: (courseId, deltaSeconds) => api.put(`/enrollments/${courseId}/time`, { deltaSeconds }),
  getAttendees: (courseId) => api.get(`/enrollments/course/${courseId}/attendees`),
  invite: (courseId, email) => api.post(`/enrollments/course/${courseId}/invite`, { email }),
  uninvite: (courseId, userId) => api.delete(`/enrollments/course/${courseId}/invite/${userId}`),
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export const progressAPI = {
  markComplete: (lessonId) => api.post('/progress/lesson', { lessonId }),
  getProgress: (courseId) => api.get(`/progress?courseId=${courseId}`),
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewAPI = {
  list: (courseId) => api.get(`/reviews/${courseId}`),
  create: (courseId, data) => api.post(`/reviews/${courseId}`, data),
}

// ─── Learner Dashboard ─────────────────────────────────────────────────────────
export const learnerAPI = {
  getDashboardStats: () => api.get('/learner/dashboard-stats'),
  getLeaderboard: () => api.get('/learner/leaderboard'),
  getInsights: () => api.get('/learner/insights'),
}

export const wishlistAPI = {
  toggle: (courseId) => api.post('/wishlist/toggle', { courseId }),
  get: () => api.get('/wishlist')
}

export const bookmarkAPI = {
  list: (courseId) => api.get('/bookmarks', { params: { courseId } }),
  add: (courseId, lessonId) => api.post('/bookmarks', { courseId, lessonId }),
  remove: (lessonId) => api.delete(`/bookmarks/${lessonId}`),
}

export const noteAPI = {
  list: (courseId, lessonId) => api.get('/notes', { params: { courseId, lessonId } }),
  upsert: (courseId, lessonId, content) => api.post('/notes', { courseId, lessonId, content }),
  delete: (lessonId) => api.delete(`/notes/${lessonId}`),
}

export const messageAPI = {
  send: (data) => api.post('/messages', data),
  getHistory: (userId, courseId) => api.get(`/messages/history/${userId}/${courseId}`),
  getChats: () => api.get('/messages/chats'),
  markRead: (senderId, courseId) => api.put(`/messages/read/${senderId}/${courseId}`),
  upload: (formData) => api.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ─── Reporting ────────────────────────────────────────────────────────────────
export const reportingAPI = {
  get: (params) => api.get('/reporting', { params }),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  fakeProcess: (data) => api.post('/payments/fake-process', data),
  getHistory: () => api.get('/payments/my-history'),
  getInstructorHistory: () => api.get('/payments/instructor/history'),
  getInstructorStats: () => api.get('/payments/instructor/stats'),
}

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcementAPI = {
  list: (courseId) => api.get(`/courses/${courseId}/announcements`),
  create: (courseId, data) => api.post(`/courses/${courseId}/announcements`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
}

// ─── Users (Community) ────────────────────────────────────────────────────────
export const userAPI = {
  toggleFollow: (id) => api.post(`/users/${id}/follow`),
  getProfile: (id) => api.get(`/users/${id}/profile`),
  getFollowers: (id) => api.get(`/users/social/followers/${id}`),
  getFollowing: (id) => api.get(`/users/social/following/${id}`),
  getNotifications: () => api.get('/users/me/notifications'),
  markNotificationsRead: () => api.patch('/users/me/notifications/read'),
  broadcastMessage: (data) => api.post('/messages/broadcast', data),
  broadcastToCourse: (data) => api.post('/messages/broadcast/course', data),
  updateProfile: (data) => api.patch('/users/me/profile', data),
};

export const socialAPI = {
  // Friend Requests
  sendRequest: (receiverId) => api.post('/social/friends/request', { receiverId }),
  respondRequest: (requestId, status) => api.post('/social/friends/respond', { requestId, status }),
  getPending: () => api.get('/social/friends/pending'),
  getFriends: () => api.get('/social/friends'),
  toggleFavorite: (friendshipId) => api.post('/social/friends/favorite', { friendshipId }),
  removeFriend: (friendId) => api.delete(`/social/friends/${friendId}`),

  // Following
  getFollowers: () => api.get('/social/followers'),

  // Blocking
  block: (targetId) => api.post('/social/block', { targetId }),
  unblock: (targetId) => api.delete(`/social/block/${targetId}`),
  getBlocked: () => api.get('/social/blocked'),

  // Search
  search: (query) => api.get('/social/search', { params: { query } }),
};

export default api
