import React from 'react';

const Loader = () => {
  return (
    <>
      <style>{`
        .loading-wave {
          height: 100px;
        }
        .loading-bar {
          width: 20px;
          height: 10px;
          margin: 0 5px;
          background-color: #00789A;
          border-radius: 5px;
          animation: loading-wave-animation 1s ease-in-out infinite;
        }
        .loading-bar:nth-child(2) { animation-delay: 0.1s; background-color: #2DB5AA; }
        .loading-bar:nth-child(3) { animation-delay: 0.2s; background-color: #00789A; }
        .loading-bar:nth-child(4) { animation-delay: 0.3s; background-color: #2DB5AA; }
        @keyframes loading-wave-animation {
          0%   { height: 10px; }
          50%  { height: 50px; }
          100% { height: 10px; }
        }
      `}</style>

      <div className="d-flex justify-content-center align-items-end loading-wave">
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
      </div>
    </>
  );
};

export default Loader;
