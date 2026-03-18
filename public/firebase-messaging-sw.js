self.importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
self.importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAbH_UQWoQnwgA_1-RcMOxEnZLVottWBGM",
  authDomain: "studyos-4d50d.firebaseapp.com",
  projectId: "studyos-4d50d",
  storageBucket: "studyos-4d50d.firebasestorage.app",
  messagingSenderId: "934899860520",
  appId: "1:934899860520:web:1643f3e0fa47c6cc13211d",
  measurementId: "G-RN2CVTC1S5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification ?? {};
  const title = notification.title ?? "StudyOS";
  const options = {
    body: notification.body ?? "Your next study block is waiting.",
    data: {
      url: payload.fcmOptions?.link ?? "/dashboard"
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (!event.notification.data?.url) {
    return;
  }

  event.waitUntil(clients.openWindow(event.notification.data.url));
});
