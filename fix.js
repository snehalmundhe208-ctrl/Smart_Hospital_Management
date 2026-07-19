const fs = require('fs');
const path = require('path');

const dir = path.join('frontend', 'src');

// Create api directory
const apiDir = path.join(dir, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir);
}

// Create axios.js
const axiosContent = `import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Pass along the authorization header if it exists in defaults
api.interceptors.request.use((config) => {
  const token = axios.defaults.headers.common['Authorization'];
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = token;
  }
  return config;
});

export default api;
`;
fs.writeFileSync(path.join(apiDir, 'axios.js'), axiosContent);

// Recursive function to replace axios imports
function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (filePath === path.join(apiDir, 'axios.js')) continue;
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes("import axios from 'axios'")) {
        // Calculate relative path
        let relative = path.relative(path.dirname(filePath), apiDir).replace(/\\/g, '/');
        if (!relative.startsWith('.')) relative = './' + relative;
        const importPath = relative + '/axios';
        content = content.replace(/import axios from 'axios';?/g, `import axios from '${importPath}';`);
        fs.writeFileSync(filePath, content);
      }
    }
  }
}

walk(dir);
console.log('Done replacing axios imports');
