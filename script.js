import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';

document.addEventListener('DOMContentLoaded', () => {
    const ddBeyond = document.querySelector('#ddBeyond');
    const teste = document.querySelector('#teste');
    let activeTooltip = null;
    let cleanup = null;

    // Error handling for missing elements
    if (!ddBeyond || !teste) {
        console.error('Required elements not found');
        return;
    }

    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        
        // Create arrow element
        const arrowElement = document.createElement('div');
        arrowElement.className = 'tooltip-arrow';
        tooltip.appendChild(arrowElement);
        
        document.body.appendChild(tooltip);
        return tooltip;
    }

    function loadTooltipContent(url, selector) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const contentElement = tempDiv.querySelector(selector);
                if (!contentElement) {
                    throw new Error(`Element with selector "${selector}" not found`);
                }
                return contentElement.innerHTML;
            });
    }

    function cleanupTooltip() {
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
        if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    }

    function setupTooltip(trigger, tooltip) {
        function update() {
            computePosition(trigger, tooltip, {
                placement: 'top',
                middleware: [
                    offset(8),
                    flip({
                        fallbackPlacements: ['bottom', 'right', 'left'],
                    }),
                    shift({ padding: 5 }),
                    arrow({ element: tooltip.querySelector('.tooltip-arrow') })
                ],
            }).then(({x, y, placement, middlewareData}) => {
                Object.assign(tooltip.style, {
                    left: `${x}px`,
                    top: `${y}px`
                });

                // Position arrow
                if (middlewareData.arrow) {
                    const { x: arrowX, y: arrowY } = middlewareData.arrow;
                    const staticSide = {
                        top: 'bottom',
                        right: 'left',
                        bottom: 'top',
                        left: 'right',
                    }[placement.split('-')[0]];

                    const arrowElement = tooltip.querySelector('.tooltip-arrow');
                    if (arrowElement) {
                        Object.assign(arrowElement.style, {
                            left: arrowX != null ? `${arrowX}px` : '',
                            top: arrowY != null ? `${arrowY}px` : '',
                            right: '',
                            bottom: '',
                            [staticSide]: '-4px'
                        });
                    }
                }
            });
        }

        return autoUpdate(trigger, tooltip, update);
    }

    // Event listeners for tooltips
    [ddBeyond, teste].forEach(element => {
        if (!element) return;
        
        element.addEventListener('mouseenter', async () => {
            // Clean up any existing tooltip
            cleanupTooltip();

            // Create new tooltip
            const tooltip = createTooltip();
            activeTooltip = tooltip;
            tooltip.style.display = 'block';
            
            try {
                const contentId = element.id === 'ddBeyond' ? 'tooltip-content-ddBeyond' : 'tooltip-content-teste';
                const content = await loadTooltipContent('tooltip-content.html', `#${contentId}`);
                
                // Only proceed if this is still the active tooltip
                if (tooltip === activeTooltip) {
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'tooltip-content';
                    contentDiv.innerHTML = content;
                    tooltip.insertBefore(contentDiv, tooltip.firstChild);
                    
                    // Setup positioning and auto-update
                    cleanup = setupTooltip(element, tooltip);
                }
            } catch (error) {
                console.error('Error setting up tooltip:', error);
                cleanupTooltip();
            }
        });

        element.addEventListener('mouseleave', cleanupTooltip);
    });
});