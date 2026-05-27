package com.encuentratumedico.msdoctor.domain.model.shared;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class ImageGallery {
    private final List<Image> images;

    private ImageGallery(List<Image> images) {
        this.images = new ArrayList<>(images);
    }

    public static ImageGallery empty() {
        return new ImageGallery(new ArrayList<>());
    }

    public static ImageGallery of(List<Image> images) {
        return new ImageGallery(images == null ? new ArrayList<>() : images);
    }

    public ImageGallery add(Image image) {
        List<Image> copy = new ArrayList<>(this.images);
        copy.add(image);
        return new ImageGallery(copy);
    }

    public List<Image> asList() {
        return Collections.unmodifiableList(images);
    }

    public int size() {
        return images.size();
    }
}
