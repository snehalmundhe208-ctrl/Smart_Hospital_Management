const fs = require('fs');
const path = require('path');

const dir = 'frontend/src/layouts';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Layout.jsx'));

files.forEach(f => {
  const file = path.join(dir, f);
  let content = fs.readFileSync(file, 'utf8');

  // Wrap {children}
  content = content.replace(
    /(\<main[^\>]*\>)\s*\{children\}\s*(\<\/main\>)/g,
    `$1\n            <motion.div\n              initial={{ opacity: 0, y: 15 }}\n              animate={{ opacity: 1, y: 0 }}\n              transition={{ duration: 0.4, ease: "easeOut" }}\n            >\n              {children}\n            </motion.div>\n          $2`
  );
  
  fs.writeFileSync(file, content);
  console.log('Updated ' + f);
});
