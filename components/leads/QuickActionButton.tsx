const commonProps = {
  className: cn(
    "relative flex h-16 items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
    "first:border-l-0 transition-all duration-200",
    getVariantStyles(),
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
  ),
}; 