import React from 'react'

export function Banner() {
  return (
    <div className="mb-6 select-none">
      <svg
        viewBox="0 0 1200 420"
        width="100%"
        height="200"
        className="block mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="siwooGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6CAEDD" />
            <stop offset="100%" stopColor="#E98C8C" />
          </linearGradient>

          <style>
            {`
                .blocky {
                  font-family: "Press Start 2P", monospace;
                  font-weight: 900;
                  letter-spacing: 10px;
                  shape-rendering: crispEdges;
                }
                .sub {
                  font-family: VT323, monospace;
                  font-weight: 800;
                  letter-spacing: 6px;
                  fill: #44D39F;
                }
              `}
          </style>
        </defs>

        <symbol id="word" overflow="visible">
          <text x="600" y="150" textAnchor="middle" className="blocky" fontSize="128">
            SIWOO
          </text>
          <text x="600" y="300" textAnchor="middle" className="blocky" fontSize="128">
            LEE
          </text>
        </symbol>

        <use
          href="#word"
          transform="translate(8,8)"
          fill="rgb(217 228 239 / var(--tw-bg-opacity, 1))"
          opacity="0.35"
        />
        <text
          x="600"
          y="150"
          textAnchor="middle"
          className="blocky"
          fontSize="128"
          fill="url(#siwooGrad)"
        >
          SIWOO
        </text>
        <text
          x="600"
          y="300"
          textAnchor="middle"
          className="blocky"
          fontSize="128"
          fill="url(#siwooGrad)"
        >
          LEE
        </text>
        <text x="600" y="400" textAnchor="middle" className="sub" fontSize="60">
          Software Engineer
        </text>
      </svg>

      <div className="mt-4 text-center text-sm text-gray-400">
        Type <span className="text-[#44D39F]">&apos;help&apos;</span> to explore
      </div>
    </div>
  )
}
