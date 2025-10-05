// Virtual File System - content source

export const FILES: Record<string, string> = {
  'README.md': `# Siwoo Lee\n\nToronto-based Software Engineer with 6+ years of experience building scalable web applications.\n\n## Quick Start\nType 'help' to see available commands.\nTry 'show recruiter' to see my recruiter card.\nTry 'run demo list' to see project demos.\n\n## About\nI specialize in:\n- Frontend: React, JavaScript, HTML/CSS, Redux, jQuery\n- Backend: Ruby on Rails, Node.js\n- Cloud: AWS (ECS, RDS, S3)\n- E-commerce platforms and web applications\n\nCurrently seeking new opportunities in Toronto!`,
  'contact.md': `# Contact Information\n\nEmail: postsw7@gmail.com\nLinkedIn: https://www.linkedin.com/in/siwoolee\nGitHub: https://github.com/postsw7\n\nPortfolio: https://postsw7.github.io\nLegacy Portfolio: https://postsw7.github.io/v1\n\nFeel free to reach out for opportunities or just to chat!`,
  'skills.md': `# Technical Skills\n\n## Frontend\n- JavaScript (ES6+), React, Redux\n- HTML5, CSS3, SASS\n- jQuery, Responsive Design\n\n## Backend\n- Ruby on Rails\n- Node.js, Express\n- RESTful APIs\n\n## Cloud & DevOps\n- AWS (ECS, RDS, S3, CloudFront)\n- Docker\n- CI/CD pipelines\n\n## E-commerce\n- Built complete e-commerce platform from scratch\n- Price comparison features\n- Payment integration\n- Inventory management`,
  'experience.md': `# Work Experience\n\n## Frontend Engineer @ Lookpin\n**2017 - 2023 | Seoul, South Korea**\n\n- Built e-commerce platform from scratch as sole frontend engineer\n- Developed price comparison system across partner stores\n- Implemented responsive design for mobile/desktop\n- Integrated payment systems and user authentication\n- Tech: React, Redux, Ruby on Rails, AWS\n\n**Key Achievement:** \nCreated Lookpin (https://www.lookpin.co.kr) - a fully functional online shopping platform for clothing and accessories.\n\n## Previous Experience\n6+ years total experience in web development\nSpecialized in frontend with full-stack capabilities`,
}

export function getFile(filename: string): string | null { return FILES[filename] || null }
export function listFiles(): string[] { return Object.keys(FILES) }
export function fileExists(filename: string): boolean { return filename in FILES }
