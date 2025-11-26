import Request from "./requests";
import type {ImagesRequestData, OptionsRequestData} from "./requests";
import Masonry from 'masonry-layout';

const grid = document.getElementById("grid-layout");

const addGridImage = function(id: number, image: string): void {
    grid?.insertAdjacentHTML("beforeend", 
        `<div class="image-wrapper" data-item-id="${id}">
            <img class="image-item" src="${image}" alt="Image ${id}">
            <button class="image-button" data-item-id="${id}">x</button>
        </div>`
    );
}

const removeGridImage = function(itemId: number): void {
    const images: HTMLCollectionOf<Element> = document.getElementsByClassName("image-wrapper");

    const itemIdStringed: string = String(itemId);
    for (const image of images) {
        if (image.getAttribute("data-item-id") === itemIdStringed) {
            image.remove();
            if (masonry) {
                masonry.remove?.([image]);
                masonry.layout?.(); 
            }
            break;
        }
    }
    
}

const updateImages = async function() {
    const images: Array<ImagesRequestData> = await Request.getImages();
    images.forEach(data => {
        addGridImage(data.id, data.image);
    });
}

grid?.addEventListener("click", async function(event) {
    event.preventDefault();
    const target = event.target as HTMLElement;

    if (target.tagName === "BUTTON" && target.className === "image-button") {
        const id = target.getAttribute("data-item-id");
        if (id === null) {
            console.error("Error while checking target on attribute 'data-item-id'");
            return;
        }
        
        const imageDelete = await Request.deleteImage(Number(id));
        if (imageDelete.success) {
            removeGridImage(Number(id));
            console.info(`Image ${id} is removed`);
        } else {
            console.error(`Image ${id} is not removed. Server error`);
        }
    }
});

await (updateImages());

const options: OptionsRequestData = await Request.getOptions();

const masonry = new Masonry('.grid-layout', {
    itemSelector: '.image-wrapper',
    columnWidth: options.columnWidth,
    gutter: options.gutter,
    fitWidth: true
});
