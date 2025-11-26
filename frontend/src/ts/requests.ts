const concatenateURL = function (path: URL | string, base: URL | string = baseURL): string {
    return (new URL(path, base)).href;
}

const baseURL: URL = new URL("http://localhost:8000/");

const RequestsEnum = {
    getAllImages: "index.php?action=get_all_images",
    uploadImage: "index.php?action=upload_image",
    deleteImage: "index.php?action=delete_image",
    getOptions: "index.php?action=get_options",
    changeOptions: "index.php?action=change_options"
} as const;

export interface ImagesRequestData {
    id: number,
    image: string
}

export interface OptionsRequestData {
    columnWidth: number,
    gutter: number
}

export default class Request {
    static async getImages(): Promise<Array<ImagesRequestData>> {
        return fetch(concatenateURL(RequestsEnum.getAllImages))
            .then(res => res.json());
    }

    static async uploadImage(image: string) {
        return fetch(concatenateURL(RequestsEnum.uploadImage), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({image: image})
        }).then(res => res.json());
    }

    static async deleteImage(id: number) {
        return fetch(concatenateURL(RequestsEnum.deleteImage), {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id})
        }).then(res => res.json());
    }

    static async getOptions(): Promise<OptionsRequestData> {
        return fetch(concatenateURL(RequestsEnum.getOptions))
            .then(res => res.json());
    }

    static async changeOptions(options: OptionsRequestData) {
        return fetch(concatenateURL(RequestsEnum.changeOptions), {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(options),
        }).then(res => res.json());
    }
}
