import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
    return (
        <div
            className={`animate-pulse bg-stone-200/70 rounded-2xl ${className}`}
            {...props}
        />
    );
};

export const CardSkeleton = () => {
    return (
        <div className="bg-white rounded-3xl border border-[#e8e2d5] p-5 shadow-xs space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="pt-2 flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
        </div>
    );
};

export const TableRowSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl border border-[#e8e2d5] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
    );
};

export default Skeleton;
