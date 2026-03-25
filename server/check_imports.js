const fs = require('fs');
const path = require('path');

const checked = new Set();

function checkFile(filePath) {
  if (checked.has(filePath)) return;
  checked.add(filePath);

  if (!fs.existsSync(filePath)) {
    console.log(`MISSING FILE: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const requires = content.match(/require\(['"](.+?)['"]\)/g);

  if (requires) {
    requires.forEach(req => {
      const modulePath = req.match(/require\(['"](.+?)['"]\)/)[1];
      if (modulePath.startsWith('.')) {
        const dir = path.dirname(filePath);
        let targetPath = path.resolve(dir, modulePath);
        
        let exists = fs.existsSync(targetPath + '.js') || fs.existsSync(path.join(targetPath, 'index.js'));
        
        if (!exists) {
          console.log(`In ${filePath}: MISSING ${modulePath} (Resolved: ${targetPath})`);
        } else {
          const nextFile = fs.existsSync(targetPath + '.js') ? targetPath + '.js' : path.join(targetPath, 'index.js');
          checkFile(nextFile);
        }
      }
    });
  }
}

checkFile(path.resolve('src/app.js'));
