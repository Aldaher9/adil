
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("خطأ في تشغيل React:", err);
    document.body.innerHTML += `<div style="color:red; padding:20px;">حدث خطأ أثناء تشغيل الواجهة: ${err.message}</div>`;
  }
} else {
  console.error("لم يتم العثور على عنصر root");
}
