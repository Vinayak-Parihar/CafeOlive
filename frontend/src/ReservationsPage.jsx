import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Film, PartyPopper, Calendar, ArrowRight, Users } from 'lucide-react';
import { ManagedImage, mediaUrl, usePublicMedia, usePublicMediaList } from './utils/mediaUtils';
import ReservationLookup from './components/ReservationLookup';
import Reveal from './components/motion/Reveal';
import { StaggerGrid, StaggerItem } from './components/motion/StaggerGrid';

const defaultDescMap = {
    'reservation-theatre': "Screen films, stream matches, host private sessions with complimentary snacks and sit-in food menu.",
    'reservation-party-hall-1': "Spacious venue crafted for elegant family get-togethers, dinner events, and private birthdays up to 35 guests.",
    'reservation-party-hall-2': "Cozy hosting space for small groups, creative workspaces, and birthday setups up to 15 guests."
};

const defaultFeaturesMap = {
    'reservation-theatre': ["Cozy recliners", "Private catering", "3-hour slots", "Dolby Atmos sound"],
    'reservation-party-hall-1': ["Dedicated host", "Custom buffet", "Ambient illumination", "Audio system setup"],
    'reservation-party-hall-2': ["Intimate setup", "High-speed WiFi", "Custom tea & bites", "Smart TV display"]
};

const defaultSpaces = [
    {
        id: "reservation-theatre",
        title: "Private Mini Theatre",
        icon: Film,
        url: "/reservations/booking?zone=theatre",
        imageKey: 'reservation-theatre',
        desc: defaultDescMap['reservation-theatre'],
        features: defaultFeaturesMap['reservation-theatre']
    },
    {
        id: "reservation-party-hall-1",
        title: "Bespoke Party Hall 1",
        icon: PartyPopper,
        url: "/reservations/booking?zone=partyHall1",
        imageKey: 'reservation-party-hall-1',
        desc: defaultDescMap['reservation-party-hall-1'],
        features: defaultFeaturesMap['reservation-party-hall-1']
    },
    {
        id: "reservation-party-hall-2",
        title: "Bespoke Party Hall 2",
        icon: PartyPopper,
        url: "/reservations/booking?zone=partyHall2",
        imageKey: 'reservation-party-hall-2',
        desc: defaultDescMap['reservation-party-hall-2'],
        features: defaultFeaturesMap['reservation-party-hall-2']
    }
];

const ReservationsPage = () => {
    const { mediaList } = usePublicMediaList();
    const media = usePublicMedia();

    const spaces = useMemo(() => {
        const venueItems = (mediaList || []).filter(
            (item) => item.section === 'reservations' &&
                      item.imageKey !== 'reservation-confirmation' &&
                      item.imageKey !== 'reservation-venue-booking' &&
                      item.isEnabled !== false
        );

        if (!venueItems.length) {
            return defaultSpaces;
        }

        return venueItems.map((item) => {
            const labelLower = (item.label || '').toLowerCase();
            const keyLower = (item.imageKey || '').toLowerCase();
            const isTheatre = keyLower.includes('theatre') || labelLower.includes('theatre');
            const isHall2 = keyLower.includes('party-hall-2') || labelLower.includes('hall 2') || labelLower.includes('hall-2');
            const isHall1 = keyLower.includes('party-hall-1') || labelLower.includes('hall 1') || labelLower.includes('hall-1');

            // Format clean title without "Reservation: " prefix
            const cleanTitle = item.label ? item.label.replace(/^Reservation:\s*/i, '').trim() : 'Bespoke Venue Hall';

            let bookingUrl = '/reservations/inquiry';
            if (isTheatre) {
                bookingUrl = '/reservations/booking?zone=theatre';
            } else if (isHall2) {
                bookingUrl = `/reservations/booking?zone=partyHall2&venue=${encodeURIComponent(cleanTitle)}`;
            } else if (isHall1) {
                bookingUrl = `/reservations/booking?zone=partyHall1&venue=${encodeURIComponent(cleanTitle)}`;
            } else {
                bookingUrl = `/reservations/booking?zone=partyHall1&venue=${encodeURIComponent(cleanTitle)}`;
            }

            const desc = item.description || defaultDescMap[item.imageKey] || "Private sanctuary crafted for bespoke gatherings, celebrations, and memorable private dining.";

            // Features: if capacity is set, feature it prominently
            let features = defaultFeaturesMap[item.imageKey] ? [...defaultFeaturesMap[item.imageKey]] : ["Dedicated host", "Audio system setup", "Ambient lighting", "Custom catering"];
            if (item.capacity) {
                const capStr = String(item.capacity).trim();
                const capFormatted = /guests?|people|capacity/i.test(capStr)
                    ? capStr
                    : `Up to ${capStr} guests`;
                features = [capFormatted, ...features.filter((f) => !f.toLowerCase().includes('guest'))].slice(0, 4);
            }

            return {
                id: item.imageKey,
                title: cleanTitle,
                icon: isTheatre ? Film : PartyPopper,
                url: bookingUrl,
                imageKey: item.imageKey,
                imageUrl: item.imageUrl,
                desc,
                capacity: item.capacity,
                features
            };
        });
    }, [mediaList]);

    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-6 font-[Montserrat]">
            <div className="max-w-container-max mx-auto">
                
                {/* Header */}
                <Reveal className="text-center mb-16">
                    <span className="text-soft-gold text-xs font-semibold uppercase tracking-[0.25em] mb-2 block">Curated Sanctuary</span>
                    <h1 className="text-4xl md:text-6xl font-[Playfair_Display] text-primary font-bold mb-4">Reservations</h1>
                    <div className="h-[2px] w-24 bg-soft-gold mx-auto opacity-70"></div>
                    <p className="mt-6 text-on-surface-variant font-light text-base md:text-lg max-w-2xl mx-auto">
                        Reserve a dedicated environment for your group. Select your experience, customize preferences, and schedule your booking.
                    </p>
                </Reveal>

                {/* Grid */}
                <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {spaces.map(space => {
                        const Icon = space.icon;
                        return (
                            <StaggerItem key={space.id} className="bg-white rounded-lg border border-surface-border overflow-hidden soft-shadow flex flex-col justify-between group">
                                <div>
                                    <div className="aspect-video overflow-hidden relative border-b border-surface-border">
                                        <ManagedImage src={space.imageUrl || mediaUrl(media, space.imageKey)} alt={space.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-4 left-4 bg-primary/95 text-white p-2.5 rounded-full">
                                            <Icon size={20} />
                                        </div>
                                        {space.capacity && (
                                            <div className="absolute top-4 right-4 bg-white/95 dark:bg-oliv-dark/95 text-primary text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                                                <Users size={12} className="text-soft-gold" /> {space.capacity}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8 space-y-4">
                                        <h3 className="text-2xl font-[Playfair_Display] font-bold text-primary">{space.title}</h3>
                                        <p className="text-on-surface-variant text-xs font-light leading-relaxed">{space.desc}</p>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-primary pt-2">
                                            {space.features.map((f, i) => (
                                                <span key={i} className="flex items-center gap-1.5">✓ {f}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 pt-0">
                                    <Link to={space.url} className="btn-stitch-primary w-full text-center inline-block text-xs font-bold uppercase tracking-wider">
                                        Configure Booking
                                    </Link>
                                </div>
                            </StaggerItem>
                        );
                    })}
                </StaggerGrid>

                {/* Find Your Reservation */}
                <ReservationLookup />

                {/* Inquiry Card */}
                <Reveal className="max-w-3xl mx-auto bg-surface-container border border-surface-border p-8 md:p-12 rounded-lg text-center soft-shadow space-y-6">
                    <Calendar className="mx-auto text-soft-gold" size={40} />
                    <h3 className="text-2xl font-[Playfair_Display] font-bold text-primary">Need a customized hosting configuration?</h3>
                    <p className="text-on-surface-variant text-sm font-light leading-relaxed max-w-xl mx-auto">
                        Speak with our events management team. We assist with custom catering options, custom decorators, and scheduling requests.
                    </p>
                    <Link to="/reservations/inquiry" className="btn-stitch-outline inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/50">
                        Send Booking Inquiry <ArrowRight size={14} />
                    </Link>
                </Reveal>

            </div>
        </div>
    );
};

export default ReservationsPage;
