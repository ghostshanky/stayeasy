import plugin from 'tailwindcss/plugin';

// Custom utilities plugin
export const customUtilities = plugin(
  function({ addUtilities, addComponents, theme }) {
    // Custom utilities for spacing and layout
    addUtilities({
      '.flex-center': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      '.flex-between': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      '.flex-col-center': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      '.text-gradient': {
        background: 'linear-gradient(135deg, var(--tw-gradient-stops))',
        '-webkit-background-clip': 'text',
        '-webkit-text-fill-color': 'transparent',
        'background-clip': 'text',
      },
      '.card-shadow': {
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      '.card-shadow-lg': {
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      '.hover-lift': {
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
        },
      },
      '.hover-scale': {
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      },
      '.text-shadow': {
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      '.text-shadow-lg': {
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      '.backdrop-blur-sm': {
        backdropFilter: 'blur(4px)',
        '-webkit-backdrop-filter': 'blur(4px)',
      },
      '.backdrop-blur-md': {
        backdropFilter: 'blur(8px)',
        '-webkit-backdrop-filter': 'blur(8px)',
      },
      '.backdrop-blur-lg': {
        backdropFilter: 'blur(16px)',
        '-webkit-backdrop-filter': 'blur(16px)',
      },
      '.scrollbar-hide': {
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      },
      '.scrollbar-thin': {
        '&::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme('colors.gray.400'),
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: theme('colors.gray.500'),
        },
      },
      '.scrollbar-thin-dark': {
        '&::-webkit-scrollbar-thumb': {
          background: theme('colors.gray.600'),
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: theme('colors.gray.500'),
        },
      },
    });

    // Custom components
    addComponents({
      '.btn': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem 1rem',
        borderRadius: theme('borderRadius.DEFAULT'),
        fontWeight: theme('fontWeight.medium'),
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
        '&:focus': {
          outline: '2px solid',
          outlineOffset: '2px',
        },
        '&:disabled': {
          opacity: '0.5',
          cursor: 'not-allowed',
        },
      },
      '.btn-primary': {
        backgroundColor: theme('colors.primary.DEFAULT'),
        color: 'white',
        '&:hover': {
          backgroundColor: theme('colors.primary.600'),
        },
        '&:focus': {
          outlineColor: theme('colors.primary.400'),
        },
      },
      '.btn-secondary': {
        backgroundColor: theme('colors.gray.200'),
        color: theme('colors.gray.800'),
        '&:hover': {
          backgroundColor: theme('colors.gray.300'),
        },
        '&:focus': {
          outlineColor: theme('colors.gray.400'),
        },
      },
      '.btn-outline': {
        backgroundColor: 'transparent',
        color: theme('colors.primary.DEFAULT'),
        border: `1px solid ${theme('colors.primary.DEFAULT')}`,
        '&:hover': {
          backgroundColor: theme('colors.primary.50'),
        },
        '&:focus': {
          outlineColor: theme('colors.primary.400'),
        },
      },
      '.btn-ghost': {
        backgroundColor: 'transparent',
        color: theme('colors.gray.600'),
        '&:hover': {
          backgroundColor: theme('colors.gray.100'),
        },
        '&:focus': {
          outlineColor: theme('colors.gray.400'),
        },
      },
      '.card': {
        backgroundColor: theme('colors.surface.DEFAULT'),
        borderRadius: theme('borderRadius.lg'),
        padding: '1.5rem',
        boxShadow: theme('boxShadow.sm'),
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme('boxShadow.md'),
        },
      },
      '.input': {
        display: 'block',
        width: '100%',
        padding: '0.5rem 0.75rem',
        borderRadius: theme('borderRadius.DEFAULT'),
        border: `1px solid ${theme('colors.border.DEFAULT')}`,
        backgroundColor: theme('colors.surface.DEFAULT'),
        transition: 'all 0.2s ease-in-out',
        '&:focus': {
          outline: 'none',
          borderColor: theme('colors.primary.DEFAULT'),
          boxShadow: `0 0 0 3px ${theme('colors.primary.200')}`,
        },
        '&:disabled': {
          opacity: '0.5',
          cursor: 'not-allowed',
        },
      },
      '.input-error': {
        borderColor: theme('colors.error.DEFAULT'),
        '&:focus': {
          boxShadow: `0 0 0 3px ${theme('colors.error.200')}`,
        },
      },
      '.badge': {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.5rem',
        borderRadius: theme('borderRadius.full'),
        fontSize: theme('fontSize.xs'),
        fontWeight: theme('fontWeight.medium'),
        whiteSpace: 'nowrap',
      },
      '.badge-primary': {
        backgroundColor: theme('colors.primary.100'),
        color: theme('colors.primary.700'),
      },
      '.badge-success': {
        backgroundColor: theme('colors.success.100'),
        color: theme('colors.success.700'),
      },
      '.badge-warning': {
        backgroundColor: theme('colors.warning.100'),
        color: theme('colors.warning.700'),
      },
      '.badge-error': {
        backgroundColor: theme('colors.error.100'),
        color: theme('colors.error.700'),
      },
      '.avatar': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: theme('borderRadius.full'),
        backgroundColor: theme('colors.gray.200'),
        color: theme('colors.gray.600'),
        fontWeight: theme('fontWeight.medium'),
        fontSize: theme('fontSize.sm'),
        overflow: 'hidden',
      },
      '.avatar-sm': {
        width: '1.5rem',
        height: '1.5rem',
        fontSize: theme('fontSize.xs'),
      },
      '.avatar-lg': {
        width: '3.5rem',
        height: '3.5rem',
        fontSize: theme('fontSize.base'),
      },
      '.divider': {
        height: '1px',
        backgroundColor: theme('colors.border.DEFAULT'),
        margin: '1rem 0',
      },
      '.divider-vertical': {
        width: '1px',
        backgroundColor: theme('colors.border.DEFAULT'),
        margin: '0 1rem',
      },
    });
  },
  {
    theme: {
      extend: {
        // Additional theme extensions can be added here
      },
    },
  }
);

// Animation utilities plugin
export const animationUtilities = plugin(
  function({ addUtilities, addComponents, theme }) {
    addUtilities({
      '.animate-fade-in': {
        animation: 'fadeIn 0.3s ease-in-out forwards',
      },
      '.animate-fade-out': {
        animation: 'fadeOut 0.3s ease-in-out forwards',
      },
      '.animate-slide-up': {
        animation: 'slideUp 0.3s ease-out forwards',
      },
      '.animate-slide-down': {
        animation: 'slideDown 0.3s ease-out forwards',
      },
      '.animate-slide-left': {
        animation: 'slideLeft 0.3s ease-out forwards',
      },
      '.animate-slide-right': {
        animation: 'slideRight 0.3s ease-out forwards',
      },
      '.animate-zoom-in': {
        animation: 'zoomIn 0.3s ease-out forwards',
      },
      '.animate-zoom-out': {
        animation: 'zoomOut 0.3s ease-in forwards',
      },
      '.animate-bounce-in': {
        animation: 'bounceIn 0.5s ease-out forwards',
      },
      '.animate-pulse-slow': {
        animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      '.animate-spin-slow': {
        animation: 'spin 3s linear infinite',
      },
    });

    addComponents({
      '.loading-spinner': {
        display: 'inline-block',
        width: '1.5rem',
        height: '1.5rem',
        border: '2px solid',
        borderColor: theme('colors.gray.200'),
        borderTopColor: theme('colors.primary.DEFAULT'),
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      },
      '.loading-dots': {
        display: 'inline-flex',
        gap: '0.25rem',
        '& > span': {
          display: 'inline-block',
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '50%',
          backgroundColor: theme('colors.primary.DEFAULT'),
          animation: 'bounce 1.4s ease-in-out infinite both',
        },
        '& > span:nth-child(1)': {
          animationDelay: '-0.32s',
        },
        '& > span:nth-child(2)': {
          animationDelay: '-0.16s',
        },
      },
    });
  }
);

// Responsive utilities plugin
export const responsiveUtilities = plugin(
  function({ addUtilities, addComponents }) {
    addUtilities({
      '.container-fluid': {
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      },
      '.grid-responsive': {
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      },
      '.flex-wrap-responsive': {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
      },
      '.text-responsive': {
        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
      },
      '.heading-responsive': {
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        lineHeight: '1.2',
      },
    });
  }
);

// Print utilities plugin
export const printUtilities = plugin(
  function({ addUtilities }) {
    addUtilities({
      '.print-hidden': {
        '@media print': {
          display: 'none',
        },
      },
      '.print-block': {
        '@media print': {
          display: 'block',
        },
      },
      '.print-inline': {
        '@media print': {
          display: 'inline',
        },
      },
      '.print-break-before': {
        '@media print': {
          'break-before': 'page',
        },
      },
      '.print-break-after': {
        '@media print': {
          'break-after': 'page',
        },
      },
    });
  }
);