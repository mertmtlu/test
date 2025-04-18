//betterScale.js
L.Control.BetterScale = L.Control.extend({
    options: {
        position: 'bottomright',
        maxWidth: 200,
        metric: true,
        imperial: false,
        updateWhenIdle: false
    },

    onAdd: function (map) {
        this._map = map;

        const container = L.DomUtil.create('div', 'leaflet-control-betterscale');
        this._container = container;

        this._scaleBar = L.DomUtil.create('div', 'leaflet-control-betterscale-bar', container);
        this._scaleText = L.DomUtil.create('div', 'leaflet-control-betterscale-text', container);

        container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        container.style.padding = '5px 10px';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';

        this._scaleBar.style.height = '4px';
        this._scaleBar.style.width = '100%';
        this._scaleBar.style.backgroundColor = '#333';
        this._scaleBar.style.marginTop = '2px';

        this._scaleText.style.color = '#333';
        this._scaleText.style.fontSize = '11px';
        this._scaleText.style.textAlign = 'center';
        this._scaleText.style.marginTop = '2px';

        map.on(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
        map.whenReady(this._update, this);

        return container;
    },

    onRemove: function (map) {
        map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    },

    _update: function () {
        const bounds = this._map.getBounds();
        const centerLat = bounds.getCenter().lat;

        const maxMeters = this._map.distance(
            bounds.getNorthWest(),
            bounds.getNorthEast()
        );
        const maxPixels = this._map.getSize().x;
        const metersPerPixel = maxMeters / maxPixels;

        const scaleWidthMeters = this._getRoundNum(
            this.options.maxWidth * metersPerPixel
        );
        const scaleWidthPixels = scaleWidthMeters / metersPerPixel;

        this._scaleBar.style.width = Math.round(scaleWidthPixels) + 'px';
        this._scaleText.innerHTML = this._formatDistance(scaleWidthMeters);
    },

    _getRoundNum: function (num) {
        const pow10 = Math.pow(10, (Math.floor(num) + '').length - 1);
        let d = num / pow10;

        d = d >= 10 ? 10 :
            d >= 5 ? 5 :
                d >= 3 ? 3 :
                    d >= 2 ? 2 : 1;

        return pow10 * d;
    },

    _formatDistance: function (meters) {
        if (meters >= 1000) {
            return (meters / 1000).toFixed(1) + ' km';
        } else {
            return Math.round(meters) + ' m';
        }
    }
});

L.control.betterScale = function (options) {
    return new L.Control.BetterScale(options);
};