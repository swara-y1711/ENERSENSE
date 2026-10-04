'use client';

import React from 'react';

export default function BuildingGridCard() {
  return (
    <section
      className="rounded-2xl overflow-hidden shadow-sm border border-surface-container-high/60 relative group"
      id="grid"
    >
      <div className="relative">
        <img
          alt="Olympus Tech Park sustainable rooftop solar microgrid"
          className="w-full h-44 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-105"
          src="https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=800&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/30 to-transparent flex items-end p-4 sm:p-5">
          <div className="text-on-primary">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed-dim font-bold block">
              Building Energy Advisory
            </span>
            <p className="font-body-sm text-body-sm text-surface-bright mt-0.5">
              Advisory recommendations help occupants align flexible activities with lower tariff periods and grid availability.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
