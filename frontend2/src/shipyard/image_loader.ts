// Copyright 2017 duncan law (mrdunk@gmail.com)

export class ImageLoader {
  public static buffer = {};

  public static get(url: string, callback: (HTMLImageElement)=>void) {
    let image = ImageLoader.buffer[url];
    if(image === undefined) {
      ImageLoader.buffer[url] = {
        image: new Image(),
        callbacks: [],
      };
      image = ImageLoader.buffer[url];
      image.image.onload = () => {
        image.callbacks.forEach((oneCallback) => {
          oneCallback(ImageLoader.buffer[url].image);
        });
      };
      image.image.src = url;
    }
    image.callbacks.push(callback);
  }
}

