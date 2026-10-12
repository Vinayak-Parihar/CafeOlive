import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

const safeFetchMedia = async () => {
    try {
        const response = await fetch(`${API_BASE}/api/home/media`);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            return null;
        }
        return await response.json();
    } catch {
        return null;
    }
};

export const usePublicMedia = () => {
    const [media, setMedia] = useState({});

    useEffect(() => {
        let cancelled = false;
        safeFetchMedia()
            .then((payload) => {
                if (cancelled || !payload?.data?.media) return;
                const map = payload.data.media.reduce((acc, item) => {
                    acc[item.imageKey] = item;
                    return acc;
                }, {});
                map._list = payload.data.media;
                setMedia(map);
            })
            .catch(() => {});

        return () => { cancelled = true; };
    }, []);

    return media;
};

export const usePublicMediaList = () => {
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        safeFetchMedia()
            .then((payload) => {
                if (cancelled) return;
                setMediaList(payload?.data?.media || []);
                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    return { mediaList, loading };
};

export const mediaUrl = (media, imageKey) => (
    media[imageKey]?.isEnabled === false ? '' : media[imageKey]?.imageUrl || ''
);

export const ManagedImage = ({ src, alt, className }) => {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <div className={`${className} bg-primary/10 flex items-center justify-center text-primary/40 text-xs font-serif`} role="img" aria-label={`${alt || 'Cafe Olive'} image not configured`}>
                <span>{alt || 'Cafe Olive Sanctuary'}</span>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setFailed(true)}
            loading="lazy"
        />
    );
};
