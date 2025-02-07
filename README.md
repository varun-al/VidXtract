# YouTube Downloader

This is a web application that allows users to download videos or audio from YouTube by providing a YouTube link as input. The project currently has a **frontend deployed**, while the **backend is not yet deployed**.

---

## Features
- Download videos or audio from YouTube using a valid URL.
- Simple and user-friendly interface.
- React-based frontend.
- **yt-dlp** and **ffmpeg** used for video/audio processing.

---

## Getting Started

### Prerequisites
To run the project locally, ensure you have the following installed:
- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **yt-dlp** and **ffmpeg**
  - These tools are essential for downloading and processing YouTube videos and audio.  

---

## Steps to Run the Project Locally

### Install `yt-dlp` and `ffmpeg`
1. **Download yt-dlp**:  
   Follow the installation instructions from the [yt-dlp GitHub repository](https://github.com/yt-dlp/yt-dlp).  
   Once downloaded, ensure it is added to your system's PATH environment variable.

2. **Download ffmpeg**:  
   Download `ffmpeg` from the official site [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html).  
   After downloading, ensure it is added to your system's PATH environment variable.  

   To check if they are installed correctly, run:
   ```bash
   yt-dlp --version
   ffmpeg -version
   ```

---

### Clone the Repository
```bash
git clone https://github.com/your-username/youtube-downloader.git
cd youtube-downloader
```

### Install Dependencies

#### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```

#### Backend
1. Navigate to the backend directory:
   ```bash
   cd ../backend
   ```
2. Install the required dependencies:
   ```bash
   npx nodemon index.js
   ```

---

### Run the Application Locally

#### Frontend
1. Start the React development server:
   ```bash
   cd frontend
   npm start
   ```
2. Open your browser and visit [http://localhost:3000](http://localhost:3000).

#### Backend (Not Yet Deployed)
- The backend isn't deployed yet, but you can run it locally by navigating to the backend folder and running:
   ```bash
   cd backend
   npm start
   ```
- It will start a local server on `http://localhost:5000` (make sure port 5000 is not in use).

---

## Deployment Status
- **Frontend**: Deployed and accessible.
- **Backend**: Not yet deployed. Stay tuned for updates!

---

## Contributing
If you'd like to contribute to the project:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b branch-name
   ```
3. Commit your changes and push the branch:
   ```bash
   git add .
   git commit -m "Description"
   git push origin branch-name
   ```
4. Open a pull request.
