const glslNoise = /* glsl */ `
    //	Simplex 3D Noise
    //	by Ian McEwan, Ashima Arts

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        //  x0 = x0 - 0. + 0.0 * C
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        // Permutations
        i = mod(i, 289.0 );
        vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
        float n_ = 1.0/7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(
            dot(p0,x0), dot(p1,x1),
            dot(p2,x2), dot(p3,x3)
        ));
    }
`;

const glslEasing = /* glsl */ `
    float easeInOut(float t) {
        float p = 2.0 * t * t;
        return t < 0.5 ? p : -p + (4.0 * t) - 1.0;
    }

    float easeOut(float t) {
        return -t * (t - 2.0);
    }
`;

const glslRotate = /* glsl */ `
    vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        mat2 m = mat2(c, -s, s, c);
        return m * v;
    }
`;

const glslTint = /* glsl */ `
    vec4 tint(vec4 baseColor, vec4 tintColor, float gamma) {
        return baseColor * clamp(vec4(gamma, gamma, gamma, 1.0) + tintColor, vec4(0.0, 0.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0));
    }
`;

const glslColorConversion = /* glsl */ `
    vec3 hsv2rgb(vec3 c)
    {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 rgb2hsv(vec3 rgb) {
        float Cmax = max(rgb.r, max(rgb.g, rgb.b));
        float Cmin = min(rgb.r, min(rgb.g, rgb.b));
        float delta = Cmax - Cmin;

        vec3 hsv = vec3(0., 0., Cmax);

        if (Cmax > Cmin) {
            hsv.y = delta / Cmax;

            if (rgb.r == Cmax)
                hsv.x = (rgb.g - rgb.b) / delta;
            else {
                if (rgb.g == Cmax)
                    hsv.x = 2. + (rgb.b - rgb.r) / delta;
                else
                    hsv.x = 4. + (rgb.r - rgb.g) / delta;
            }
            hsv.x = fract(hsv.x / 6.);
        }
        return hsv;
    }

    vec3 rgb2ycbcr(vec3 c){
        float y=.299*c.r+.587*c.g+.114*c.b;
        return vec3(y,(c.b-y)*.565,(c.r-y)*.713);
    }

    vec4 grayscale(vec4 baseColor, float brightness) {
        float y = clamp(rgb2ycbcr(baseColor.rgb).r * brightness, 0.0, 1.0);
        return vec4(y, y, y, 1.0);
    }
`;

export const FalopaShader = {
    uniforms: {
        tDiffuse: { value: null },
        distortionScale: { value: 0.1 },
        distortionFrequency: { value: 5.0 },
        time: { value: 0.0 },
        tintFactor: { value: 0.0 },
        rotationFactor: { value: 0.2 },
    },

    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float distortionScale;
        uniform float distortionFrequency;
        uniform float time;
        uniform float tintFactor;
        uniform float rotationFactor;
        varying vec2 vUv;

        ${glslNoise}
        ${glslEasing}
        ${glslRotate}
        ${glslTint}
        ${glslColorConversion}

        void main() {
            // Don't distort the borders so we don't clip outside of the image too much.
            float borderSize = 5.0;
            float borderFactorX = vUv.x < 0.5 ? easeOut(clamp(vUv.x * borderSize, 0.0, 1.0)) : easeOut(clamp((1.0 - vUv.x) * borderSize, 0.0, 1.0));
            float borderFactorY = vUv.y < 0.5 ? easeOut(clamp(vUv.y * borderSize, 0.0, 1.0)) : easeOut(clamp((1.0 - vUv.y) * borderSize, 0.0, 1.0));

            vec2 centeredUv = vUv - vec2(0.5, 0.5);
            vec2 offsetPoint = vec2(
                (snoise(vec3(centeredUv * distortionFrequency, time + 0.0)) - 0.5),
                (snoise(vec3(centeredUv * distortionFrequency, time + 10.0)) - 0.5)
            ) * borderFactorX * borderFactorY;

            vec2 samplePoint = vUv + offsetPoint * distortionScale;

            float distanceToCenter = distance(vUv, vec2(0.5, 0.5));
            float angle = cos(distanceToCenter * 10.0) * rotationFactor * snoise(vec3(vUv, time + 20.0));
            samplePoint = rotate(samplePoint, angle);

            vec4 texel = texture2D(tDiffuse, samplePoint);
            vec3 tintColor = vec3(time * 5.0, 1.0, 1.0);

            vec4 tintedColor = tint(texel, vec4(hsv2rgb(tintColor), 1.0), 0.7);
            vec4 grayscaleColor = grayscale(texel, 1.5);

            gl_FragColor = mix(grayscaleColor, tintedColor, clamp(tintFactor, 0.0, 1.0));
        }`,
};
