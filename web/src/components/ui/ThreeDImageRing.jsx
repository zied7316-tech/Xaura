"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, easeOut, animate } from "framer-motion";
import { cn } from "../../utils/cn";
import Card, { CardContent } from "./Card";
import Button from "./Button";
import Badge from "./Badge";
import SafeImage from "./SafeImage";
import { Clock, DollarSign, Calendar } from "lucide-react";

export function ThreeDImageRing({
  services = [],
  width = 320,
  perspective = 3000,
  imageDistance = 500,
  initialRotation = 0,
  animationDuration = 1.5,
  staggerDelay = 0.1,
  hoverOpacity = 0.5,
  containerClassName,
  ringClassName,
  cardClassName,
  backgroundColor,
  draggable = true,
  ease = "easeOut",
  mobileBreakpoint = 768,
  mobileScaleFactor = 0.7,
  inertiaPower = 0.8,
  inertiaTimeConstant = 300,
  inertiaVelocityMultiplier = 20,
  onBookService,
  uploadService,
  formatDuration,
  formatCurrency,
  capitalizeFirst,
  ShinyText,
  onImageClick,
}) {
  const containerRef = useRef(null);
  const ringRef = useRef(null);
  const rotationY = useMotionValue(initialRotation);
  const startX = useRef(0);
  const currentRotationY = useRef(initialRotation);
  const isDragging = useRef(false);
  const velocity = useRef(0);
  const [currentScale, setCurrentScale] = useState(1);
  const [showCards, setShowCards] = useState(false);

  const angle = useMemo(() => 360 / services.length, [services.length]);

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const newScale = viewportWidth <= mobileBreakpoint ? mobileScaleFactor : 1;
      setCurrentScale(newScale);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [mobileBreakpoint, mobileScaleFactor]);

  useEffect(() => {
    setShowCards(true);
  }, []);

  const handleDragStart = (event) => {
    if (!draggable) return;

    isDragging.current = true;
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    startX.current = clientX;

    rotationY.stop();
    velocity.current = 0;

    if (ringRef.current && ringRef.current.style) {
      ringRef.current.style.cursor = "grabbing";
    }

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchmove", handleDrag);
    document.addEventListener("touchend", handleDragEnd);
  };

  const handleDrag = (event) => {
    if (!draggable || !isDragging.current) return;

    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    const deltaX = clientX - startX.current;

    velocity.current = -deltaX * 0.5;
    rotationY.set(currentRotationY.current + velocity.current);
    startX.current = clientX;
  };

  const handleDragEnd = () => {
    isDragging.current = false;

    if (ringRef.current && ringRef.current.style) {
      ringRef.current.style.cursor = "grab";
      currentRotationY.current = rotationY.get();
    }

    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDrag);
    document.removeEventListener("touchend", handleDragEnd);

    const initial = rotationY.get();
    const velocityBoost = velocity.current * inertiaVelocityMultiplier;
    const target = initial + velocityBoost;

    animate(initial, target, {
      type: "inertia",
      velocity: velocityBoost,
      power: inertiaPower,
      timeConstant: inertiaTimeConstant,
      restDelta: 0.5,
      modifyTarget: (target) => Math.round(target / angle) * angle,
      onUpdate: (latest) => {
        rotationY.set(latest);
      },
    });

    velocity.current = 0;
  };

  const cardVariants = {
    hidden: { y: 200, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full overflow-hidden select-none relative",
        containerClassName
      )}
      style={{
        backgroundColor,
        transform: `scale(${currentScale})`,
        transformOrigin: "center center",
      }}
      onMouseDown={draggable ? handleDragStart : undefined}
      onTouchStart={draggable ? handleDragStart : undefined}
    >
      <div
        style={{
          perspective: `${perspective}px`,
          width: "100%",
          height: "100%",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          ref={ringRef}
          className={cn(
            "w-full h-full absolute",
            ringClassName
          )}
          style={{
            transformStyle: "preserve-3d",
            rotateY: rotationY,
            cursor: draggable ? "grab" : "default",
          }}
        >
          <AnimatePresence>
            {showCards && services.map((service, index) => {
              const translateZ = imageDistance * currentScale;
              const rotationAngle = index * -angle;
              
              return (
                <motion.div
                  key={service._id || index}
                  className={cn(
                    "absolute",
                    cardClassName
                  )}
                  style={{
                    width: `${width}px`,
                    transformStyle: "preserve-3d",
                    left: "50%",
                    top: "50%",
                    marginLeft: `-${width / 2}px`,
                    marginTop: `-200px`,
                    transform: `rotateY(${rotationAngle}deg) translateZ(${translateZ}px)`,
                    pointerEvents: isDragging.current ? "none" : "auto",
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={cardVariants}
                  custom={index}
                  transition={{
                    delay: index * staggerDelay,
                    duration: animationDuration,
                    ease: easeOut,
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 } 
                  }}
                  onHoverStart={() => {
                    if (isDragging.current) return;
                    if (ringRef.current) {
                      Array.from(ringRef.current.children).forEach((cardEl, i) => {
                        if (i !== index && cardEl && cardEl.style) {
                          cardEl.style.opacity = `${hoverOpacity}`;
                        }
                      });
                    }
                  }}
                  onHoverEnd={() => {
                    if (isDragging.current) return;
                    if (ringRef.current) {
                      Array.from(ringRef.current.children).forEach((cardEl) => {
                        if (cardEl && cardEl.style) {
                          cardEl.style.opacity = `1`;
                        }
                      });
                    }
                  }}
                >
                  <Card className="border border-gray-200 shadow-lg bg-white">
                    <CardContent className="p-4">
                      {/* Service Image */}
                      <div 
                        className="h-64 w-full overflow-hidden rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity relative group"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onImageClick && service.image) {
                            onImageClick(service.image);
                          }
                        }}
                        title="Click to view full size"
                      >
                        <SafeImage
                          src={service.image ? uploadService.getImageUrl(service.image, { width: 1080, height: 1080 }) : null}
                          alt={service.name}
                          className="w-full h-full object-cover"
                          fallbackType="service"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded">
                            Click to enlarge
                          </div>
                        </div>
                      </div>

                      <div className="mb-2 text-center">
                        <h4 className="mb-2">
                          {ShinyText ? (
                            <ShinyText
                              size="2xl"
                              weight="bold"
                              baseColor="#667eea"
                              shineColor="#764ba2"
                              speed={3}
                              intensity={1}
                              direction="left-to-right"
                              shineWidth={30}
                              className="tracking-wide"
                            >
                              {capitalizeFirst ? capitalizeFirst(service.name) : service.name}
                            </ShinyText>
                          ) : (
                            <span className="text-xl font-bold">{service.name}</span>
                          )}
                        </h4>
                        <div className="flex justify-center">
                          <Badge variant="default" size="sm">{service.category}</Badge>
                        </div>
                      </div>

                      {service.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 text-center">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock size={16} />
                          <span>{formatDuration ? formatDuration(service.duration) : `${service.duration} min`}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign size={16} />
                          <span>{formatCurrency ? formatCurrency(service.price) : `$${service.price}`}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBookService) {
                            onBookService(service._id);
                          }
                        }}
                        fullWidth
                      >
                        <Calendar size={16} />
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default ThreeDImageRing;
