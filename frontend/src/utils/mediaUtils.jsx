import { useEffect, useState } from 'react';

export const usePublicMedia = () => {
    const [media, setMedia] = useState({});

    useEffect(() => {
        let cancelled = false;
        fetch('/api/home/media')
            .then((response) => response.ok ? response.json() : null)
            .then((payload) => {
                if (cancelled || !payload?.data?.media) return;
                setMedia(payload.data.media.reduce((map, item) => {
                    map[item.imageKey] = item;
                    return map;
                }, {}));
            })
            .catch((error) => console.error('Failed to fetch website media:', error));

        return () => { cancelled = true; };
    }, []);

    return media;
};

export const mediaUrl = (media, imageKey) => (
    media[imageKey]?.isEnabled === false ? '' : media[imageKey]?.imageUrl || ''
);

export const ManagedImage = ({ src, alt, className }) => (
    src ? <img src={src} alt={alt} className={className} /> : <div className={`${className} bg-primary/10`} role="img" aria-label={`${alt} image not configured`} />
);
