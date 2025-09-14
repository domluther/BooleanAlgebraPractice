// Test Touch Functionality
// This file can be used to verify touch interactions work properly

console.log('Touch compatibility test for Boolean Algebra Practice');

// Check if touch events are supported
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    console.log('✅ Touch events are supported');
    
    // Test touch event simulation
    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('circuitCanvas');
        if (canvas) {
            console.log('✅ Circuit canvas found');
            
            // Test that touch-action is set
            const computedStyle = window.getComputedStyle(canvas);
            const touchAction = computedStyle.getPropertyValue('touch-action');
            console.log(`Canvas touch-action: ${touchAction}`);
            
            if (touchAction === 'none') {
                console.log('✅ Touch-action is properly set to none');
            } else {
                console.log('❌ Touch-action should be set to none');
            }
        } else {
            console.log('❌ Circuit canvas not found');
        }
        
        // Test gate selection functionality
        const gates = document.querySelectorAll('.gate[data-gate-type]');
        if (gates.length > 0) {
            console.log(`✅ Found ${gates.length} gates with data-gate-type attributes`);
        } else {
            console.log('❌ No gates found with data-gate-type attributes');
        }
        
        // Test that gates have proper event handlers
        gates.forEach((gate, index) => {
            console.log(`Gate ${index + 1}: ID=${gate.id}, Type=${gate.dataset.gateType}`);
        });
    });
} else {
    console.log('❌ Touch events are not supported on this device');
}

// Export test functions for manual testing
window.touchTest = {
    simulateTouchStart: function(element, x, y) {
        const touch = new Touch({
            identifier: 1,
            target: element,
            clientX: x,
            clientY: y,
            radiusX: 2.5,
            radiusY: 2.5,
            rotationAngle: 10,
            force: 0.5,
        });
        
        const touchEvent = new TouchEvent('touchstart', {
            cancelable: true,
            bubbles: true,
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch],
            shiftKey: true,
        });
        
        element.dispatchEvent(touchEvent);
    },
    
    simulateTouchEnd: function(element, x, y) {
        const touch = new Touch({
            identifier: 1,
            target: element,
            clientX: x,
            clientY: y,
            radiusX: 2.5,
            radiusY: 2.5,
            rotationAngle: 10,
            force: 0.5,
        });
        
        const touchEvent = new TouchEvent('touchend', {
            cancelable: true,
            bubbles: true,
            touches: [],
            targetTouches: [],
            changedTouches: [touch],
            shiftKey: true,
        });
        
        element.dispatchEvent(touchEvent);
    }
};

console.log('Touch test utilities available at window.touchTest');