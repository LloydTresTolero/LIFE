# How to Push This Project to GitHub

Follow these steps to push your LIFE project to a GitHub repository.

## Prerequisites
- Git installed on your system
- A GitHub account
- GitHub repository created (or you can create one during the process)

## Step-by-Step Instructions

### 1. Initialize Git (if not already initialized)
If you haven't initialized Git in this project yet, run:
```bash
git init
```

### 2. Check Current Status
See what files are tracked/modified:
```bash
git status
```

### 3. Add Files to Staging
Add all files to staging:
```bash
git add .
```

Or add specific files:
```bash
git add <filename>
```

### 4. Create Initial Commit
Commit your changes:
```bash
git commit -m "Initial commit: LIFE emergency app"
```

### 5. Create GitHub Repository
- Go to [GitHub.com](https://github.com)
- Click the "+" icon in the top right corner
- Select "New repository"
- Name your repository (e.g., "LIFE" or "life-emergency-app")
- Choose public or private
- **DO NOT** initialize with README, .gitignore, or license (since you already have files)
- Click "Create repository"

### 6. Add Remote Repository
Copy the repository URL from GitHub (HTTPS or SSH) and add it as remote:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

### 7. Push to GitHub
Push your code to the main branch:
```bash
git branch -M main
git push -u origin main
```

If you're using a different default branch name (like `master`), use:
```bash
git push -u origin master
```

### 8. Verify
Check your GitHub repository page - you should see all your files there!

## Authentication

### Using HTTPS
If prompted for credentials:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your GitHub password)
  - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate a new token with `repo` permissions
  - Use this token as your password

### Using SSH (Recommended)
1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. Add SSH key to GitHub:
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub Settings → SSH and GPG keys → New SSH key
   - Paste your key and save
3. Use SSH URL when adding remote:
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

## Future Updates

After making changes to your code:

1. Check status:
   ```bash
   git status
   ```

2. Add changes:
   ```bash
   git add .
   ```

3. Commit:
   ```bash
   git commit -m "Description of your changes"
   ```

4. Push:
   ```bash
   git push
   ```

## Common Issues

### Issue: "Repository not found"
- Check that the repository name and username are correct
- Verify you have access to the repository
- Ensure you're authenticated properly

### Issue: "Permission denied"
- Check your SSH key is added to GitHub (if using SSH)
- Verify your Personal Access Token has correct permissions (if using HTTPS)

### Issue: "Updates were rejected"
- Someone else may have pushed changes
- Pull first: `git pull origin main` (or `git pull origin master`)
- Resolve any conflicts, then push again

## .gitignore

Make sure you have a `.gitignore` file to exclude:
- `node_modules/`
- `.expo/`
- `.env` files (if containing sensitive data)
- Build artifacts
- OS-specific files

If you don't have one, create a `.gitignore` file with:
```
node_modules/
.expo/
dist/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.pem
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Need Help?

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Help](https://help.github.com)
- [GitHub Desktop](https://desktop.github.com/) - GUI alternative if you prefer visual tools
