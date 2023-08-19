
const callAPI = async () => {
	
	const INPUT_DATA = createPrompt();
	if(INPUT_DATA == null)
		return;
	console.log("Prompt: " + INPUT_DATA.prompt);	
	
	try {
		let content = await apiCallToGPT(INPUT_DATA.prompt);
		console.log(content)
		if (content.length > 0) {
			let slideContents = createSlides(content, INPUT_DATA.slideTitles);
			showPpt(slideContents);
			const targetSection = document.getElementById('slides-wrapper');
			targetSection.scrollIntoView({ behavior: 'smooth' });
		} else {
			console.log('ERROR => Failed to receive response.');
			alert('Unable to generate presentation.');
		}
	} catch (error) {
		console.error('API Error:', error);
		alert('API Error. Unable to generate presentation.');
	} finally {
		document.getElementsByClassName("progress")[0].style.display = "none";
	}
};

function validateInputFields() {

    const presentationName = document.getElementById('my-text-box').value;
    const numSlides = parseInt(document.getElementById('no-of-slide').value, 10);

	const objective = document.getElementById('objectiveSelect').value;
	const targetedAudience = document.getElementById('audienceSelect').value;
	
    const specialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (!presentationName || specialCharacters.test(presentationName) || presentationName.length > 50) {
        alert('Please provide a valid presentation name (max 50 characters, no special characters).');
        return false;
    }

	if(targetedAudience == "none")
	{
		alert('Please select Target Audience.');
		return false;
	}

	if (objective == "none")
	{
		alert('Please select Presentation Objective.');
		return false;
	}
	
    if (isNaN(numSlides) || numSlides < 1 || numSlides > 20) {
        alert('Number of slides must be between 1 and 20.');
        return false;
    }

    const inputFields = document.getElementsByClassName('slideName');
    for (let i = 0; i < inputFields.length; i++) {
        const inputValue = inputFields[i].value;
        if (!inputValue) {
            alert('Please fill in all slide title fields.');
            return false;
        }
    }

    return true;
}


function createPrompt() {
    if (!validateInputFields()) {
        return null; // Validation failed, return null or handle as needed
    }

    const presentationName = document.getElementById('my-text-box').value;
    const targetedAudience = document.getElementById('audienceSelect').value;
    const numSlides = document.getElementById('no-of-slide').value;
    const objective = document.getElementById('objectiveSelect').value;
    document.getElementsByClassName("progress")[0].style.display = "block";

    const slideTitles = [];
    const inputFields = document.getElementsByClassName('slideName');

    for (let i = 0; i < inputFields.length; i++) {
        const inputValue = inputFields[i].value;
        slideTitles.push(inputValue);
    }
    const slidesStr = "Slide titles should be " + slideTitles.join(', ');
    const PROMPT = `Write  ${numSlides} slides about ${presentationName}.
    Each slide should have four points with a maximum of 17 words per point.
    Targeted Audience is ${targetedAudience} and presentation objective is ${objective}. 
    ${slidesStr}`;

    return { prompt: PROMPT, slideTitles: slideTitles };
}

const apiCallToGPT = async (PROMPT) => {
	const MODEL = 'gpt-3.5-turbo';
	const API_KEY = '';
	const IP_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
	const MESSAGE = [{ role: "user", content: PROMPT }];
	try {
		const response = await fetch(IP_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`
			},
			body: JSON.stringify({
				model: MODEL,
				messages: MESSAGE,
				temperature: 0.5
			})
		});
		const jsonResponse = await response.json();
		console.log('INFO => Response Received');
		return jsonResponse.choices[0].message.content;
	} catch (error) {
		console.error(error);
	}
}

function createSlides(content, slideTitles) {
    const slides = content.split(/\nSlide \d+:\s+/);
    const formattedSlides = slides.map((slide, index) => {
        const [title, ...content] = slide.trim().split('\n');
        const formattedTitle = slideTitles[index].trim();
        const formattedContent = content.map((point) => {
            const cleanedPoint = point.replace(/^\d+\.\s*/, '').trim();
            return cleanedPoint.startsWith('- ') ? cleanedPoint.substring(2) : cleanedPoint;
        });
        return { title: formattedTitle, content: formattedContent };
    });
    return formattedSlides;
}

async function showPpt(slideContents) {
	const slidesContainer = document.getElementById('slides-wrapper');
	slidesContainer.innerHTML = '';
	try {
		// TITLE SLIDE
		// const titleSlide = document.createElement('div');
		// titleSlide.className = 'rounded-container title-slide';
		// titleSlide.textContent = searchTopic;
		// slidesContainer.appendChild(titleSlide);

		// // MORE SLIDES
		// imagesData.results.forEach((imageData, index) => {
		// 	let slideContent = slideContents[index]
		// 	const slide = document.createElement('div');
		// 	slide.className = 'rounded-container';

		// 	const title = document.createElement('div');
		// 	title.className = 'title';
		// 	title.textContent = slideContent.title;
		// 	slide.appendChild(title);

		// 	const columns = document.createElement('div');
		// 	columns.className = 'columns';

		// 	const leftColumn = document.createElement('div');
		// 	leftColumn.className = 'left-column';

		// 	const content = document.createElement('div');
		// 	content.className = 'content';
		// 	const ul = document.createElement('ul');
		// 	for (const point of slideContent.content) 
		// 	{
		// 		const li = document.createElement('li');
		// 		li.textContent = point;
		// 		ul.appendChild(li);
		// 	}
		// 	content.appendChild(ul);
		// 	leftColumn.appendChild(content);
		// 	columns.appendChild(leftColumn);

		// 	const rightColumn = document.createElement('div');
		// 	rightColumn.className = 'right-column';
		// 	const image = document.createElement('img');
		// 	image.className = 'ppt-image';
		// 	image.src = imageData.urls.regular;
		// 	image.alt = 'Unsplash Image';
		// 	rightColumn.appendChild(image);
		// 	columns.appendChild(rightColumn);

		// 	slide.appendChild(columns);

		// 	slidesContainer.appendChild(slide);
		// });
		const slideImages = await fetchSlideImages();
		const backgroundImage = await fetchBackgroundImage();
		downloadPptxOld(slideContents, slideImages, backgroundImage);
	}
	catch (error) {
		console.error('Error:', error);
	}

}

async function fetchSlideImages() {
	const NUM_SLIDES = parseInt(document.getElementById('no-of-slide').value);
	const TOPIC = document.getElementById('my-text-box').value;
	const API_KEY = '';
	const API_URL = `https://api.unsplash.com/search/photos?query=${TOPIC}&client_id=${API_KEY}&per_page=${NUM_SLIDES}`;

	try {
		const response = await fetch(API_URL);
		const slideImages = await response.json();
		console.log("::fetchSlideImages");
		return slideImages;
	}
	catch (error) {
		console.error('Error:', error);
	}
}

async function fetchBackgroundImage() {
	const PHOTO_ID = "BMc6gdvStWs";
	const API_KEY = '';
	const API_URL = `https://api.unsplash.com/photos/${PHOTO_ID}?client_id=${API_KEY}`;
	try {
		const response = await fetch(API_URL);
		const backgroundImage = await response.json();
		console.log("::fetchBackgroundImage");
		return backgroundImage.urls.regular;

	} catch (error) {
		console.error('Error fetching photo:', error);
	}
}

async function downloadPptxOld(slideContents, slideImages, backgroundImage) {
	let pptx = new PptxGenJS();
	pptx.defineSlideMaster({
		title: 'Title Page',
		objects: [
			{ 'image': { x: 0, y: 0, w: "100%", h: "100%", path: backgroundImage } },
		]
	});

	pptx.defineSlideMaster({
		title: 'Slide Master',
		slideNumber: { x: "95%", y: "90%", color: "FF0000" },
		objects: [
			{ 'image': { x: 0, y: 0, w: "100%", h: "100%", path: backgroundImage } },
			{ 'rect': { x: "5%", y: "3%", w: '90%', h: '15%', fill: '636363' } },
		]
	});

	const titlePage = pptx.addSlide('Title Page');
	titlePage.addText(slideContents[0].title, { x: 0, y: 0, w: '100%', h: '100%', align: 'center', fontFace: 'Georgia', fontItalic: true, fontSize: 40, color: 'FFFFFF' });
	
	slideContents.forEach((slideContent, index) => {
		const slide = pptx.addSlide('Slide Master');
		slide.addText(slideContent.title, { x: 0, y: 0, w: '100%', h: '20%', align: 'center', fontFace: 'Georgia', fontSize: 26, color: 'FFFFFF' });
		let bulletPoints = [];
		for (let index = 0; index < slideContent.content.length; index++) {
			bulletPoints.push(`• ${slideContent.content[index]}\n`);
		}
		slide.addText(bulletPoints.join(''), { x: '5%', y: '25%', w: '52%', h: '60%', fontFace: 'Comfortaa', fontSize: 12, color: 'ffffff', align: 'justify', lineSpacing: '20' });
		
		const imageSrc = slideImages.results[index % slideImages.results.length].urls.regular;
		slide.addImage({
			path: imageSrc,
			x: '60%', y: '25%', w: '35%', h: '60%',
		});
	});
	
	pptx.writeFile({ fileName: 'MyPresentation.pptx' })
		.then(() => {
			alert("Presentation downloaded successfully.");
		})
		.catch((err) => {
			alert("Error downloading Presentation.");
			console.error(err);
		});

}
