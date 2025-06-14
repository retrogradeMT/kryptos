#!/usr/bin/env node
console.log('Script started')
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const runCommand = (command) => {
  try {
    console.log(`Running command: ${command}`)
    execSync(`${command}`, { stdio: 'inherit' })
  }
  catch (err) {
    console.error(`Failed to run command: ${command}`, err)
    return false
  }
  return true
}

const modifyPackageJson = (repoName) => {
  try {
    const packageJsonPath = path.join(repoName, 'package.json')
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf-8')
    const packageJsonObj = JSON.parse(packageJsonData)

    // Modify the properties
    delete packageJsonObj.version
    delete packageJsonObj.bin
    packageJsonObj.name = repoName
    packageJsonObj.description = `A really cool Edge Site for ${repoName}`

    // Write the file back
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonObj, null, 2))
  }
  catch (err) {
    console.error('Failed to modify package.json', err)
    return false
  }
  return true
}

const process = require('node:process')

const repoName = process.argv[2]

const gitCheckoutCommand = `git clone --depth 1 https://github.com/Edge-Marketing-and-Design/edge-site-starter.git ${repoName}`
const removeGitDirCommand = `rm -rf ${repoName}/.git`
const installDependenciesCommand = `cd ${repoName} && pnpm store prune && pnpm install --force --ignore-scripts=false`
const initGitCommand = `cd ${repoName} && git init && git add . && git commit -m "Initial commit"`

console.log(`Cloning with name ${repoName}...`)
const checkedOut = runCommand(gitCheckoutCommand)
if (!checkedOut) {
  process.exit(1)
}

console.log(`Removing .git directory from ${repoName}...`)
const removedGitDir = runCommand(removeGitDirCommand)
if (!removedGitDir) {
  process.exit(1)
}

console.log(`Modifying package.json for ${repoName}...`)
const modifiedPackageJson = modifyPackageJson(repoName)
if (!modifiedPackageJson) {
  process.exit(1)
}

console.log(`Installing dependencies for ${repoName}...`)
const installedDeps = runCommand(installDependenciesCommand)
if (!installedDeps) {
  process.exit(1)
}

console.log(`Initializing new git repo in ${repoName}...`)
const initializedGit = runCommand(initGitCommand)
if (!initializedGit) {
  process.exit(1)
}

console.log(`Successfully created ${repoName}!`)
console.log(`cd into ${repoName} and run 'pnpm dev'.`)
