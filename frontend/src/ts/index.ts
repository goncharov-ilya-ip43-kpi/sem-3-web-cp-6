import Request from "./requests";
import type {OptionsRequestData} from "./requests";

const imagesForm = document.getElementById("uploadImagesForm") as HTMLFormElement;
const optionsForm = document.getElementById("updateOptionsForm") as HTMLFormElement;

const widthInput = optionsForm.elements.namedItem("width") as HTMLInputElement;
const gapInput = optionsForm.elements.namedItem("gap") as HTMLInputElement;

imagesForm?.addEventListener("submit", async event => {
    event.preventDefault();
    
    const imagesInputNotChecked = document.getElementById("images");
    if (!imagesInputNotChecked) {
        console.error("Element '#images' is not found");
        return;
    }
    const imagesInput: HTMLInputElement = imagesInputNotChecked as HTMLInputElement;

    if (imagesInput && imagesInput.files && imagesInput.files.length > 0) {
        const filesArray: File[] = Array.from(imagesInput.files);
        
        const readFileAsBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        try {
            const uploadPromises = filesArray.map(async file => {
                const base64String = await readFileAsBase64(file);
                return Request.uploadImage(base64String);
            });

            const results = await Promise.all(uploadPromises);
            results.forEach((result, index) => {
                if (result.success) {
                    console.log(`Image ${index + 1} uploaded successfully with ID: ${result.id}`);
                } else {
                    console.error(`Error uploading image ${index + 1}: ${result.error}`);
                }
            });
            imagesInput.value = '';
        } catch (error) {
            console.error('Error while posting images:', error);
        }
    } else {
        console.warn('Files are not selected');
    }
});

optionsForm?.addEventListener("submit", event => {
    event.preventDefault();

    const options: OptionsRequestData = {
        columnWidth: Number(widthInput.value),
        gutter: Number(gapInput.value)
    } as const;

    const columnWidthBottomLimit: number = 100;
    const gutterBottomLimit: number = 0;
    const columnWidthTopLimit: number = 750;
    const gutterTopLimit: number = 75;

    if (options.columnWidth < columnWidthBottomLimit || options.columnWidth > columnWidthTopLimit) {
        alert(`Width option must be in range [${columnWidthBottomLimit}; ${columnWidthTopLimit}]`);
        return;
    } else if (options.gutter < gutterBottomLimit || options.gutter > gutterTopLimit) {
        alert(`Gap option must be in range [${gutterBottomLimit}; ${gutterTopLimit}]`);
        return;
    }
    Request.changeOptions(options);
});

const loadedOptions: OptionsRequestData = await Request.getOptions();
widthInput.value = String(loadedOptions.columnWidth);
gapInput.value = String(loadedOptions.gutter);