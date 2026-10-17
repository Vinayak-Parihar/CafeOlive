import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Film, PartyPopper, Users, Sparkles, Check, ArrowRight } from 'lucide-react';
import { ManagedImage, usePublicMediaList } from './utils/mediaUtils';
import ReservationLookup from './components/ReservationLookup';
import Reveal from './components/motion/Reveal';

const DEFAULT_SPACES = [
    {
        id: 'reservation-theatre',
        zone: 'theatre',
        badge: 'Boutique Suite',
        title: 'Mini Theatre',
        rateText: 'From ₹1,200/hr',
        capacityText: 'Up to 8 Guests',
        url: '/reservations/booking?zone=theatre',
        imageKey: 'reservation-theatre',
        fallbackImage: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80',
        desc: 'Intimate private screening lounge with acoustic insulation, 4K projection, plush recliners, and sit-in food menu.',
        features: ['4K Laser Projection', 'Dedicated Host', 'Custom Soundscape', 'Tasting Menus']
    },
    {
        id: 'reservation-party-hall-1',
        zone: 'partyHall1',
        badge: 'Most Popular',
        title: 'Hall 1 (The Grand Atrium)',
        rateText: 'From ₹1,500/hr',
        capacityText: 'Up to 50 Guests',
        url: '/reservations/booking?zone=partyHall1',
        imageKey: 'reservation-party-hall-1',
        fallbackImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        desc: 'Sunlit botanical hall with arched ceilings, modular banquet seating, dedicated culinary staging counter, and ambient illumination.',
        features: ['Up to 50 guests', 'Dedicated host', 'Audio system setup', 'Ambient lighting']
    },
    {
        id: 'reservation-party-hall-2',
        zone: 'partyHall2',
        badge: 'Grand Celebrations',
        title: 'Hall 2 (The Heritage Ballroom)',
        rateText: 'From ₹2,800/hr',
        capacityText: 'Up to 100 Guests',
        url: '/reservations/booking?zone=partyHall2',
        imageKey: 'reservation-party-hall-2',
        fallbackImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        desc: 'Spacious double-height banquet hall designed for grand banquets, wedding receptions, and milestone celebrations with private hearth kitchen.',
        features: ['Up to 100 guests', 'Full AV setup', 'Private banquet bar', 'Custom staging']
    }
];

const ReservationsPage = () => {
    const { mediaList } = usePublicMediaList();

    const spaces = useMemo(() => {
        const venueItems = (mediaList || []).filter(
            (item) => item.section === 'reservations' &&
                      item.imageKey !== 'reservation-confirmation' &&
                      item.imageKey !== 'reservation-venue-booking' &&
                      item.isEnabled !== false
        );

        if (!venueItems.length) {
            return DEFAULT_SPACES;
        }

        return venueItems.map((item, idx) => {
            const keyLower = (item.imageKey || '').toLowerCase();
            const labelLower = (item.label || '').toLowerCase();
            const isTheatre = keyLower.includes('theatre') || labelLower.includes('theatre');
            const isHall2 = keyLower.includes('party-hall-2') || labelLower.includes('hall 2');

            const cleanTitle = item.label ? item.label.replace(/^Reservation:\s*/i, '').trim() : `Sanctuary Hall ${idx + 1}`;

            let zone = 'partyHall1';
            let bookingUrl = `/reservations/booking?zone=partyHall1&venue=${encodeURIComponent(cleanTitle)}`;
            let badge = 'Private Suite';
            let rateText = 'From ₹1,500/hr';

            if (isTheatre) {
                zone = 'theatre';
                bookingUrl = '/reservations/booking?zone=theatre';
                badge = 'Boutique Suite';
                rateText = 'From ₹1,200/hr';
            } else if (isHall2) {
                zone = 'partyHall2';
                bookingUrl = `/reservations/booking?zone=partyHall2&venue=${encodeURIComponent(cleanTitle)}`;
                badge = 'Grand Celebrations';
                rateText = 'From ₹2,800/hr';
            }

            const capStr = item.capacity ? String(item.capacity).trim() : (isTheatre ? 'Up to 8 Guests' : 'Up to 50 Guests');
            const capacityText = /guests?|people/i.test(capStr) ? capStr : `Up to ${capStr} guests`;

            const desc = item.description || (isTheatre
                ? 'Intimate private screening lounge with acoustic insulation, 4K projection, plush recliners, and sit-in food menu.'
                : 'Sunlit botanical hall with arched ceilings, modular banquet seating, and ambient illumination.');

            const features = isTheatre
                ? ['4K Laser Projection', 'Dedicated Host', 'Custom Soundscape', 'Tasting Menus']
                : [capacityText, 'Dedicated host', 'Audio system setup', 'Ambient lighting'];

            return {
                id: item.imageKey || item._id,
                zone,
                badge,
                title: cleanTitle,
                rateText,
                capacityText,
                url: bookingUrl,
                imageKey: item.imageKey,
                imageUrl: item.imageUrl,
                fallbackImage: isTheatre ? DEFAULT_SPACES[0].fallbackImage : DEFAULT_SPACES[1].fallbackImage,
                desc,
                features
            };
        });
    }, [mediaList]);

    return (
        <div className="min-h-screen bg-transparent font-sans text-olive-deep antialiased selection:bg-olive-rich selection:text-linen">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
                {/* Hero Header */}
                <Reveal className="pt-6 pb-12 text-center max-w-3xl mx-auto">
                    <span className="inline-block text-[11px] md:text-xs font-semibold uppercase tracking-[0.28em] text-gold-accent mb-3">
                        Curated Sanctuary
                    </span>
                    <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-olive-deep leading-[1.15] mb-5">
                        Reservations & Sanctuaries
                    </h1>
                    <div className="w-12 h-[1.5px] bg-gold-accent/70 mx-auto mb-6" />
                    <p className="text-base sm:text-lg text-olive-muted font-light leading-relaxed max-w-2xl mx-auto">
                        Reserve a dedicated environment for your group. Select your experience, customize preferences, and schedule your celebration or corporate gathering.
                    </p>
                </Reveal>

                {/* Sanctuaries Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
                    {spaces.map((space) => (
                        <article
                            key={space.id}
                            className="bg-cream-surface rounded-3xl overflow-hidden border border-[#e8e4d8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                {/* Visual Image & Badges */}
                                <div className="relative h-60 w-full overflow-hidden bg-stone-200">
                                    <ManagedImage
                                        src={space.imageUrl || space.fallbackImage}
                                        alt={space.title}
                                        className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                                    />
                                    {/* Top Badges */}
                                    <div className="absolute top-4 left-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-olive-deep/85 backdrop-blur-sm text-gold-subtle text-[11px] font-medium tracking-wide">
                                            <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
                                            {space.badge}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/95 text-[11px] font-medium">
                                            <Users className="w-3.5 h-3.5 text-gold-accent" />
                                            {space.capacityText}
                                        </span>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="p-7">
                                    <div className="flex items-baseline justify-between mb-2">
                                        <h2 className="font-serif text-2xl font-semibold text-olive-deep">
                                            {space.title}
                                        </h2>
                                        <span className="text-xs font-semibold tracking-wider text-olive-rich/80">
                                            {space.rateText}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-olive-muted mb-6">
                                        {space.desc}
                                    </p>

                                    {/* Feature Inclusions */}
                                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[11.5px] font-medium text-olive-deep/90 border-t border-[#ece7dc] pt-5">
                                        {space.features.map((feature, fIdx) => (
                                            <div key={fIdx} className="flex items-center gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-gold-accent shrink-0" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="px-7 pb-7 pt-2">
                                <Link
                                    to={space.url}
                                    className="w-full inline-flex items-center justify-center py-3.5 rounded-full bg-olive-deep hover:bg-olive-rich text-white text-xs font-bold tracking-widest uppercase transition-colors shadow-sm group"
                                >
                                    <span>CONFIGURE BOOKING</span>
                                    <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Reservation Lookup Section */}
                <div className="pt-8 border-t border-[#e8e4d8]">
                    <ReservationLookup />
                </div>
            </main>
        </div>
    );
};

export default ReservationsPage;
