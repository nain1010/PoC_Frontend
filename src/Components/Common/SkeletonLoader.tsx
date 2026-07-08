import React from 'react';

interface SkeletonProps {
    width?: string;
    height?: string;
    className?: string;
    borderRadius?: string;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({ 
    width = '100%', 
    height = '20px', 
    className = '',
    borderRadius = '4px'
}) => {
    return (
        <div 
            className={`placeholder-glow ${className}`}
            style={{ width, height, borderRadius, backgroundColor: '#e9ecef', overflow: 'hidden' }}
        >
            <span className="placeholder w-100 h-100 d-inline-block" style={{ borderRadius }}></span>
        </div>
    );
};

export default SkeletonLoader;
