#!/usr/bin/env node

/**
 * Version bump script for iOS and Android
 * Updates both platforms together to maintain consistency
 */

const fs = require('fs');
const path = require('path');

const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');
const APP_CONFIG_PATH = path.join(__dirname, '..', 'app.config.ts');

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    process.exit(1);
  }
}

function updateAppConfig(version, buildNumber) {
  try {
    let content = fs.readFileSync(APP_CONFIG_PATH, 'utf8');
    
    // Update version
    content = content.replace(
      /version:\s*['"][^'"]*['"]/,
      `version: '${version}'`
    );
    
    // Update iOS build number
    content = content.replace(
      /buildNumber:\s*['"][^'"]*['"]/,
      `buildNumber: '${buildNumber}'`
    );
    
    // Update Android version code
    content = content.replace(
      /versionCode:\s*\d+/,
      `versionCode: ${buildNumber.replace(/\./g, '')}`
    );
    
    fs.writeFileSync(APP_CONFIG_PATH, content);
    console.log('✅ Updated app.config.ts');
  } catch (error) {
    console.error('Error updating app.config.ts:', error.message);
    process.exit(1);
  }
}

function bumpVersion(type) {
  const packageJson = readJsonFile(PACKAGE_JSON_PATH);
  const currentVersion = packageJson.version;
  
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  let newVersion;
  
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    default:
      console.error('Invalid version type. Use: major, minor, or patch');
      process.exit(1);
  }
  
  // Update package.json
  packageJson.version = newVersion;
  writeJsonFile(PACKAGE_JSON_PATH, packageJson);
  console.log(`✅ Updated package.json to ${newVersion}`);
  
  // Update app.config.ts
  updateAppConfig(newVersion, newVersion);
  
  console.log(`\n🎉 Version bumped from ${currentVersion} to ${newVersion}`);
  console.log(`📱 iOS build number: ${newVersion}`);
  console.log(`🤖 Android version code: ${newVersion.replace(/\./g, '')}`);
  console.log('\nNext steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Commit: git add . && git commit -m "chore: bump version to ${newVersion}"');
  console.log('3. Tag: git tag v${newVersion}');
}

// Get version type from command line
const versionType = process.argv[2];

if (!versionType || !['major', 'minor', 'patch'].includes(versionType)) {
  console.log('Usage: node scripts/version-bump.js <major|minor|patch>');
  console.log('Example: node scripts/version-bump.js patch');
  process.exit(1);
}

bumpVersion(versionType);
