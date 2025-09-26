import React from "react";

const ChatAppLogo = ({ size = "w-9 h-9" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={size}
    >
      {/* Background Gradients */}
      <defs>
        <linearGradient id="mainGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />   {/* lightest purple */}
          <stop offset="30%" stopColor="#a855f7" />  {/* light purple */}
          <stop offset="70%" stopColor="#8b5cf6" />  {/* medium purple */}
          <stop offset="100%" stopColor="#7c3aed" /> {/* darker purple */}
        </linearGradient>
        <linearGradient id="waveGradient1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e879f9" />   {/* pink-purple */}
          <stop offset="50%" stopColor="#c084fc" />  {/* light purple */}
          <stop offset="100%" stopColor="#a855f7" /> {/* medium purple */}
        </linearGradient>
        <linearGradient id="waveGradient2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#581c87" />   {/* very dark purple */}
          <stop offset="50%" stopColor="#6b21a8" />  {/* dark purple */}
          <stop offset="100%" stopColor="#7c3aed" /> {/* medium-dark purple */}
        </linearGradient>
      </defs>

      {/* Main rounded chat bubble */}
      <path
        d="M 50 35 
           H 150 
           Q 165 35 165 50
           V 100
           Q 165 115 150 115
           H 90
           Q 85 115 80 120
           L 55 145
           Q 50 150 45 145
           Q 40 140 45 135
           L 65 115
           Q 60 115 55 110
           V 105
           H 50
           Q 35 105 35 90
           V 50
           Q 35 35 50 35 Z"
        fill="url(#mainGradient)"
      />

      {/* Top flowing wave - more organic shape */}
      <path
        d="M 50 55
           Q 75 45, 105 50
           Q 125 55, 145 45
           Q 160 40, 160 50
           Q 160 65, 145 70
           Q 125 75, 105 65
           Q 85 55, 65 65
           Q 50 70, 50 60
           V 55 Z"
        fill="url(#waveGradient1)"
        opacity="0.9"
      />

      {/* Bottom flowing wave - darker, more dramatic */}
      <path
        d="M 50 70
           Q 70 60, 100 70
           Q 120 80, 140 65
           Q 155 55, 160 65
           Q 160 80, 145 85
           Q 125 90, 100 85
           Q 80 80, 60 90
           Q 50 95, 50 85
           V 70 Z"
        fill="url(#waveGradient2)"
        opacity="0.8"
      />

      {/* Additional smooth flowing element */}
      <path
        d="M 55 75
           Q 85 65, 115 75
           Q 135 85, 155 70"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default ChatAppLogo;