// Configuration for Cognito Identity Pool and AWS
AWS.config.region = 'ap-southeast-2'; // Region
const identityPoolId = 'ap-southeast-2:5e6d21f1-af0d-45d7-9e2d-84556a44a947'; // AWS Identity pool ID

// Initialize the Amazon Cognito credentials provider
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId
});

// Function to authenticate user
function authenticateUser() {
    return new Promise((resolve, reject) => {
        AWS.config.credentials.get(function(err) {
            if (err) {
                console.error('Error retrieving credentials', err);
                reject(err);
            } else {
                console.log('Successfully retrieved credentials');
                console.log('Cognito Identity Id:', AWS.config.credentials.identityId);
                resolve();
            }
        });
    });
}

// Function to upload data
async function uploadData() {
    try {
        await authenticateUser();

        const productName = document.getElementById('productName').value;
        const productDescription = document.getElementById('productDescription').value;
        const productCost = document.getElementById('productCost').value;
        const videoFile = document.getElementById('inputFile').files[0];

        if (!productName || !productDescription || !productCost || !videoFile) {
            alert('Please fill all fields and select a video file.');
            return;
        }

        // Create XML data
        const xmlData = `
        <Product>
            <Name>${productName}</Name>
            <Description>${productDescription}</Description>
            <Cost>${productCost}</Cost>
        </Product>
        `;
        const xmlBlob = new Blob([xmlData], { type: 'application/xml' });
        const xmlFileName = `${productName}.xml`;

        // Upload XML file to S3
        const s3 = new AWS.S3();
        const xmlParams = {
            Bucket: 'aiasimg',
            Key: xmlFileName,
            Body: xmlBlob,
            ContentType: 'application/xml'
        };

        await s3.upload(xmlParams).promise();
        console.log('Successfully uploaded XML');

        // Upload video file to S3
        const videoFileName = `${productName}.${videoFile.name.split('.').pop()}`;
        const videoParams = {
            Bucket: 'aiasscan',
            Key: videoFileName,
            Body: videoFile,
            ContentType: videoFile.type
        };

        // Shows the result of the upload of information so when successful, a success alert is shown and if an error occurs it will show it
        const videoUploadResult = await s3.upload(videoParams).promise();
        console.log('Successfully uploaded video', videoUploadResult);
        document.getElementById('result').innerHTML = `<p>Successfully uploaded video and product information! </p>`;

    } catch (error) {
        console.error('Error in uploadData:', error);
        document.getElementById('result').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Drag and Drop for uploading image/video
const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("inputFile");
const imageView = document.getElementById("image-view");

inputFile.addEventListener("change", uploadImage);

dropArea.addEventListener("dragover", function(e) {
    e.preventDefault();
});

dropArea.addEventListener("drop", function(e) {
    e.preventDefault();
    inputFile.files = e.dataTransfer.files;
    uploadImage();
});

// Event listener for form submission
document.getElementById('uploadForm').addEventListener('submit', function(event) {
  event.preventDefault();
  uploadData();
});

function uploadImage() {
  const file = inputFile.files[0];
  if (file.type.startsWith('video/')) {
      let videoLink = URL.createObjectURL(file);
      imageView.innerHTML = `
          <div class="video-preview">
              <video width="100%" height="auto">
                  <source src="${videoLink}" type="${file.type}">
              </video>
              <div class="video-options">
                  <button type="button" onclick="playVideo(event)">Play</button>
                  <button type="button" onclick="changeUpload(event)">Change Upload</button>
              </div>
          </div>`;
      imageView.style.border = 0;
  } else if (file.type.startsWith('image/')) {
      let imgLink = URL.createObjectURL(file);
      imageView.innerHTML = `<img src="${imgLink}" alt="Uploaded Image" style="max-width: 100%; height: auto;">`;
      imageView.style.border = 0;
  } else {
      alert('Please select a video or image file');
  }
}

function playVideo(event) {
  event.preventDefault();
  const video = document.querySelector('.video-preview video');
  if (video) {
      video.play();
  }
}

function changeUpload(event) {
  event.preventDefault();
  inputFile.click();
}
