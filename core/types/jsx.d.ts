// Borrowed from https://github.com/preactjs/preact/blob/2cafedee2ddf7c73795e887ef1970df4be2bca90/src/jsx.d.ts
// LICENSE
/// <reference lib="dom" />

import {
	Tree
} from '../dist/tree';
import {
	ViewActor,
	MessageName
} from '../dist/actor';


type DOMEventTarget = InputEvent['currentTarget'] & {};


// Extras
type Key = string | number | any;

interface Attributes {
	key?: Key;
	jsx?: boolean;
}

interface VNode<P = {}> {
	type: string;
	props: P & { children: any };
	key: Key;
}

interface ActorDOMAttributes {
	children?: any;
}

// Base

type Defaultize<Props, Defaults> =
	// Distribute over unions
	Props extends any // Make any properties included in Default optional
		? Partial<Pick<Props, Extract<keyof Props, keyof Defaults>>> & // Include the remaining properties from Props
				Pick<Props, Exclude<keyof Props, keyof Defaults>>
		: never;

export namespace JSXInternal {
	export type LibraryManagedAttributes<Component, Props> = Component extends {
		defaultProps: infer Defaults;
	}
		? Defaultize<Props, Defaults>
		: Props;

	export interface IntrinsicAttributes {
		key?: any;
	}

	export type ElementType<A extends ViewActor, P = any> =
		| {
				[K in keyof IntrinsicElements<A>]: P extends IntrinsicElements<A>[K]
					? K
					: never;
		  }[keyof IntrinsicElements<A>];
	interface VNodeElement extends VNode<any> {}
	export type Element = VNodeElement | Tree;

	export interface ElementAttributesProperty {
		props: any;
	}

	export interface ElementChildrenAttribute {
		children: any;
	}

	export type DOMCSSProperties = {
		[key in keyof Omit<
			CSSStyleDeclaration,
			| 'item'
			| 'setProperty'
			| 'removeProperty'
			| 'getPropertyValue'
			| 'getPropertyPriority'
		>]?: string | number | null | undefined;
	};
	export type AllCSSProperties = {
		[key: string]: string | number | null | undefined;
	};
	export interface CSSProperties extends AllCSSProperties, DOMCSSProperties {
		cssText?: string | null;
	}

	export interface SVGAttributes<A extends ViewActor = ViewActor>
		extends HTMLAttributes<A> {
		accentHeight?: number | string;
		accumulate?: 'none' | 'sum';
		additive?: 'replace' | 'sum';
		alignmentBaseline?:
			| 'auto'
			| 'baseline'
			| 'before-edge'
			| 'text-before-edge'
			| 'middle'
			| 'central'
			| 'after-edge'
			| 'text-after-edge'
			| 'ideographic'
			| 'alphabetic'
			| 'hanging'
			| 'mathematical'
			| 'inherit';
		allowReorder?: 'no' | 'yes';
		alphabetic?: number | string;
		amplitude?: number | string;
		arabicForm?: 'initial' | 'medial' | 'terminal' | 'isolated';
		ascent?: number | string;
		attributeName?: string;
		attributeType?: string;
		autoReverse?: number | string;
		azimuth?: number | string;
		baseFrequency?: number | string;
		baselineShift?: number | string;
		baseProfile?: number | string;
		bbox?: number | string;
		begin?: number | string;
		bias?: number | string;
		by?: number | string;
		calcMode?: number | string;
		capHeight?: number | string;
		clip?: number | string;
		clipPath?: string;
		clipPathUnits?: number | string;
		clipRule?: number | string;
		colorInterpolation?: number | string;
		colorInterpolationFilters?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
		colorProfile?: number | string;
		colorRendering?: number | string;
		contentScriptType?: number | string;
		contentStyleType?: number | string;
		cursor?: number | string;
		cx?: number | string;
		cy?: number | string;
		d?: string;
		decelerate?: number | string;
		descent?: number | string;
		diffuseConstant?: number | string;
		direction?: number | string;
		display?: number | string;
		divisor?: number | string;
		dominantBaseline?: number | string;
		dur?: number | string;
		dx?: number | string;
		dy?: number | string;
		edgeMode?: number | string;
		elevation?: number | string;
		enableBackground?: number | string;
		end?: number | string;
		exponent?: number | string;
		externalResourcesRequired?: number | string;
		fill?: string;
		fillOpacity?: number | string;
		fillRule?: 'nonzero' | 'evenodd' | 'inherit';
		filter?: string;
		filterRes?: number | string;
		filterUnits?: number | string;
		floodColor?: number | string;
		floodOpacity?: number | string;
		focusable?: number | string;
		fontFamily?: string;
		fontSize?: number | string;
		fontSizeAdjust?: number | string;
		fontStretch?: number | string;
		fontStyle?: number | string;
		fontVariant?: number | string;
		fontWeight?: number | string;
		format?: number | string;
		from?: number | string;
		fx?: number | string;
		fy?: number | string;
		g1?: number | string;
		g2?: number | string;
		glyphName?: number | string;
		glyphOrientationHorizontal?: number | string;
		glyphOrientationVertical?: number | string;
		glyphRef?: number | string;
		gradientTransform?: string;
		gradientUnits?: string;
		hanging?: number | string;
		horizAdvX?: number | string;
		horizOriginX?: number | string;
		ideographic?: number | string;
		imageRendering?: number | string;
		in2?: number | string;
		in?: string;
		intercept?: number | string;
		k1?: number | string;
		k2?: number | string;
		k3?: number | string;
		k4?: number | string;
		k?: number | string;
		kernelMatrix?: number | string;
		kernelUnitLength?: number | string;
		kerning?: number | string;
		keyPoints?: number | string;
		keySplines?: number | string;
		keyTimes?: number | string;
		lengthAdjust?: number | string;
		letterSpacing?: number | string;
		lightingColor?: number | string;
		limitingConeAngle?: number | string;
		local?: number | string;
		markerEnd?: string;
		markerHeight?: number | string;
		markerMid?: string;
		markerStart?: string;
		markerUnits?: number | string;
		markerWidth?: number | string;
		mask?: string;
		maskContentUnits?: number | string;
		maskUnits?: number | string;
		mathematical?: number | string;
		mode?: number | string;
		numOctaves?: number | string;
		offset?: number | string;
		opacity?: number | string;
		operator?: number | string;
		order?: number | string;
		orient?: number | string;
		orientation?: number | string;
		origin?: number | string;
		overflow?: number | string;
		overlinePosition?: number | string;
		overlineThickness?: number | string;
		paintOrder?: number | string;
		panose1?: number | string;
		pathLength?: number | string;
		patternContentUnits?: string;
		patternTransform?: number | string;
		patternUnits?: string;
		pointerEvents?: number | string;
		points?: string;
		pointsAtX?: number | string;
		pointsAtY?: number | string;
		pointsAtZ?: number | string;
		preserveAlpha?: number | string;
		preserveAspectRatio?: string;
		primitiveUnits?: number | string;
		r?: number | string;
		radius?: number | string;
		refX?: number | string;
		refY?: number | string;
		renderingIntent?: number | string;
		repeatCount?: number | string;
		repeatDur?: number | string;
		requiredExtensions?: number | string;
		requiredFeatures?: number | string;
		restart?: number | string;
		result?: string;
		rotate?: number | string;
		rx?: number | string;
		ry?: number | string;
		scale?: number | string;
		seed?: number | string;
		shapeRendering?: number | string;
		slope?: number | string;
		spacing?: number | string;
		specularConstant?: number | string;
		specularExponent?: number | string;
		speed?: number | string;
		spreadMethod?: string;
		startOffset?: number | string;
		stdDeviation?: number | string;
		stemh?: number | string;
		stemv?: number | string;
		stitchTiles?: number | string;
		stopColor?: string;
		stopOpacity?: number | string;
		strikethroughPosition?: number | string;
		strikethroughThickness?: number | string;
		string?: number | string;
		stroke?: string;
		strokeDasharray?: string | number;
		strokeDashoffset?: string | number;
		strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
		strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
		strokeMiterlimit?: string | number;
		strokeOpacity?: number | string;
		strokeWidth?: number | string;
		surfaceScale?: number | string;
		systemLanguage?: number | string;
		tableValues?: number | string;
		targetX?: number | string;
		targetY?: number | string;
		textAnchor?: string;
		textDecoration?: number | string;
		textLength?: number | string;
		textRendering?: number | string;
		to?: number | string;
		transform?: string;
		u1?: number | string;
		u2?: number | string;
		underlinePosition?: number | string;
		underlineThickness?: number | string;
		unicode?: number | string;
		unicodeBidi?: number | string;
		unicodeRange?: number | string;
		unitsPerEm?: number | string;
		vAlphabetic?: number | string;
		values?: string;
		vectorEffect?: number | string;
		version?: string;
		vertAdvY?: number | string;
		vertOriginX?: number | string;
		vertOriginY?: number | string;
		vHanging?: number | string;
		vIdeographic?: number | string;
		viewBox?: string;
		viewTarget?: number | string;
		visibility?: number | string;
		vMathematical?: number | string;
		widths?: number | string;
		wordSpacing?: number | string;
		writingMode?: number | string;
		x1?: number | string;
		x2?: number | string;
		x?: number | string;
		xChannelSelector?: string;
		xHeight?: number | string;
		xlinkActuate?: string;
		xlinkArcrole?: string;
		xlinkHref?: string;
		xlinkRole?: string;
		xlinkShow?: string;
		xlinkTitle?: string;
		xlinkType?: string;
		xmlBase?: string;
		xmlLang?: string;
		xmlns?: string;
		xmlnsXlink?: string;
		xmlSpace?: string;
		y1?: number | string;
		y2?: number | string;
		y?: number | string;
		yChannelSelector?: string;
		z?: number | string;
		zoomAndPan?: string;
	}

	export interface PathAttributes {
		d: string;
	}

	export type TargetedEvent<
		Target extends DOMEventTarget = DOMEventTarget,
		TypedEvent extends Event = Event
	> = Omit<TypedEvent, 'currentTarget'> & {
		readonly currentTarget: Target;
	};

	export type TargetedAnimationEvent<
		Target extends DOMEventTarget
	> = TargetedEvent<Target, AnimationEvent>;
	export type TargetedClipboardEvent<
		Target extends DOMEventTarget
	> = TargetedEvent<Target, ClipboardEvent>;
	export type TargetedCompositionEvent<
		Target extends DOMEventTarget
	> = TargetedEvent<Target, CompositionEvent>;
	export type TargetedDragEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		DragEvent
	>;
	export type TargetedFocusEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		FocusEvent
	>;
	export type TargetedInputEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		InputEvent
	>;
	export type TargetedKeyboardEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		KeyboardEvent
	>;
	export type TargetedMouseEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		MouseEvent
	>;
	export type TargetedPointerEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		PointerEvent
	>;
	export type TargetedSubmitEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		SubmitEvent
	>;
	export type TargetedTouchEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		TouchEvent
	>;
	export type TargetedTransitionEvent<
		Target extends DOMEventTarget
	> = TargetedEvent<Target, TransitionEvent>;
	export type TargetedUIEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		UIEvent
	>;
	export type TargetedWheelEvent<Target extends DOMEventTarget> = TargetedEvent<
		Target,
		WheelEvent
	>;

	export interface EventHandler<E extends TargetedEvent> {
		/**
		 * The `this` keyword always points to the DOM element the event handler
		 * was invoked on. See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Event_handlers#Event_handlers_parameters_this_binding_and_the_return_value
		 */
		(this: never, event: E): void;
	}

	export type AnimationEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedAnimationEvent<Target>
	>;
	export type ClipboardEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedClipboardEvent<Target>
	>;
	export type CompositionEventHandler<
		Target extends DOMEventTarget
	> = EventHandler<TargetedCompositionEvent<Target>>;
	export type DragEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedDragEvent<Target>
	>;
	export type FocusEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedFocusEvent<Target>
	>;
	export type GenericEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedEvent<Target>
	>;
	export type KeyboardEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedKeyboardEvent<Target>
	>;
	export type MouseEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedMouseEvent<Target>
	>;
	export type PointerEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedPointerEvent<Target>
	>;
	export type TouchEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedTouchEvent<Target>
	>;
	export type TransitionEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedTransitionEvent<Target>
	>;
	export type UIEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedUIEvent<Target>
	>;
	export type WheelEventHandler<Target extends DOMEventTarget> = EventHandler<
		TargetedWheelEvent<Target>
	>;

	export interface DOMAttributes<A extends ViewActor = ViewActor> extends ActorDOMAttributes  {
		// Image Events
		onLoad?: MessageName<A>;
		onLoadCapture?: MessageName<A>;
		onError?: MessageName<A>;
		onErrorCapture?: MessageName<A>;

		// Clipboard Events
		onCopy?: MessageName<A>;
		onCopyCapture?: MessageName<A>;
		onCut?: MessageName<A>;
		onCutCapture?: MessageName<A>;
		onPaste?: MessageName<A>;
		onPasteCapture?: MessageName<A>;

		// Composition Events
		onCompositionEnd?: MessageName<A>;
		onCompositionEndCapture?: MessageName<A>;
		onCompositionStart?: MessageName<A>;
		onCompositionStartCapture?: MessageName<A>;
		onCompositionUpdate?: MessageName<A>;
		onCompositionUpdateCapture?: MessageName<A>;

		// Details Events
		onToggle?: MessageName<A>;

		// Focus Events
		onFocus?: MessageName<A>;
		onFocusCapture?: MessageName<A>;
		onfocusin?: MessageName<A>;
		onfocusinCapture?: MessageName<A>;
		onfocusout?: MessageName<A>;
		onfocusoutCapture?: MessageName<A>;
		onBlur?: MessageName<A>;
		onBlurCapture?: MessageName<A>;

		// Form Events
		onChange?: MessageName<A>;
		onChangeCapture?: MessageName<A>;
		onInput?: MessageName<A>;
		onInputCapture?: MessageName<A>;
		onBeforeInput?: MessageName<A>;
		onBeforeInputCapture?: MessageName<A>;
		onSearch?: MessageName<A>;
		onSearchCapture?: MessageName<A>;
		onSubmit?: MessageName<A>;
		onSubmitCapture?: MessageName<A>;
		onInvalid?: MessageName<A>;
		onInvalidCapture?: MessageName<A>;
		onReset?: MessageName<A>;
		onResetCapture?: MessageName<A>;
		onFormData?: MessageName<A>;
		onFormDataCapture?: MessageName<A>;

		// Keyboard Events
		onKeyDown?: MessageName<A>;
		onKeyDownCapture?: MessageName<A>;
		onKeyPress?: MessageName<A>;
		onKeyPressCapture?: MessageName<A>;
		onKeyUp?: MessageName<A>;
		onKeyUpCapture?: MessageName<A>;

		// Media Events
		onAbort?: MessageName<A>;
		onAbortCapture?: MessageName<A>;
		onCanPlay?: MessageName<A>;
		onCanPlayCapture?: MessageName<A>;
		onCanPlayThrough?: MessageName<A>;
		onCanPlayThroughCapture?: MessageName<A>;
		onDurationChange?: MessageName<A>;
		onDurationChangeCapture?: MessageName<A>;
		onEmptied?: MessageName<A>;
		onEmptiedCapture?: MessageName<A>;
		onEncrypted?: MessageName<A>;
		onEncryptedCapture?: MessageName<A>;
		onEnded?: MessageName<A>;
		onEndedCapture?: MessageName<A>;
		onLoadedData?: MessageName<A>;
		onLoadedDataCapture?: MessageName<A>;
		onLoadedMetadata?: MessageName<A>;
		onLoadedMetadataCapture?: MessageName<A>;
		onLoadStart?: MessageName<A>;
		onLoadStartCapture?: MessageName<A>;
		onPause?: MessageName<A>;
		onPauseCapture?: MessageName<A>;
		onPlay?: MessageName<A>;
		onPlayCapture?: MessageName<A>;
		onPlaying?: MessageName<A>;
		onPlayingCapture?: MessageName<A>;
		onProgress?: MessageName<A>;
		onProgressCapture?: MessageName<A>;
		onRateChange?: MessageName<A>;
		onRateChangeCapture?: MessageName<A>;
		onSeeked?: MessageName<A>;
		onSeekedCapture?: MessageName<A>;
		onSeeking?: MessageName<A>;
		onSeekingCapture?: MessageName<A>;
		onStalled?: MessageName<A>;
		onStalledCapture?: MessageName<A>;
		onSuspend?: MessageName<A>;
		onSuspendCapture?: MessageName<A>;
		onTimeUpdate?: MessageName<A>;
		onTimeUpdateCapture?: MessageName<A>;
		onVolumeChange?: MessageName<A>;
		onVolumeChangeCapture?: MessageName<A>;
		onWaiting?: MessageName<A>;
		onWaitingCapture?: MessageName<A>;

		// MouseEvents
		onClick?: MessageName<A>;
		onClickCapture?: MessageName<A>;
		onContextMenu?: MessageName<A>;
		onContextMenuCapture?: MessageName<A>;
		onDblClick?: MessageName<A>;
		onDblClickCapture?: MessageName<A>;
		onDrag?: MessageName<A>;
		onDragCapture?: MessageName<A>;
		onDragEnd?: MessageName<A>;
		onDragEndCapture?: MessageName<A>;
		onDragEnter?: MessageName<A>;
		onDragEnterCapture?: MessageName<A>;
		onDragExit?: MessageName<A>;
		onDragExitCapture?: MessageName<A>;
		onDragLeave?: MessageName<A>;
		onDragLeaveCapture?: MessageName<A>;
		onDragOver?: MessageName<A>;
		onDragOverCapture?: MessageName<A>;
		onDragStart?: MessageName<A>;
		onDragStartCapture?: MessageName<A>;
		onDrop?: MessageName<A>;
		onDropCapture?: MessageName<A>;
		onMouseDown?: MessageName<A>;
		onMouseDownCapture?: MessageName<A>;
		onMouseEnter?: MessageName<A>;
		onMouseEnterCapture?: MessageName<A>;
		onMouseLeave?: MessageName<A>;
		onMouseLeaveCapture?: MessageName<A>;
		onMouseMove?: MessageName<A>;
		onMouseMoveCapture?: MessageName<A>;
		onMouseOut?: MessageName<A>;
		onMouseOutCapture?: MessageName<A>;
		onMouseOver?: MessageName<A>;
		onMouseOverCapture?: MessageName<A>;
		onMouseUp?: MessageName<A>;
		onMouseUpCapture?: MessageName<A>;

		// Selection Events
		onSelect?: MessageName<A>;
		onSelectCapture?: MessageName<A>;

		// Touch Events
		onTouchCancel?: MessageName<A>;
		onTouchCancelCapture?: MessageName<A>;
		onTouchEnd?: MessageName<A>;
		onTouchEndCapture?: MessageName<A>;
		onTouchMove?: MessageName<A>;
		onTouchMoveCapture?: MessageName<A>;
		onTouchStart?: MessageName<A>;
		onTouchStartCapture?: MessageName<A>;

		// Pointer Events
		onPointerOver?: MessageName<A>;
		onPointerOverCapture?: MessageName<A>;
		onPointerEnter?: MessageName<A>;
		onPointerEnterCapture?: MessageName<A>;
		onPointerDown?: MessageName<A>;
		onPointerDownCapture?: MessageName<A>;
		onPointerMove?: MessageName<A>;
		onPointerMoveCapture?: MessageName<A>;
		onPointerUp?: MessageName<A>;
		onPointerUpCapture?: MessageName<A>;
		onPointerCancel?: MessageName<A>;
		onPointerCancelCapture?: MessageName<A>;
		onPointerOut?: MessageName<A>;
		onPointerOutCapture?: MessageName<A>;
		onPointerLeave?: MessageName<A>;
		onPointerLeaveCapture?: MessageName<A>;
		onGotPointerCapture?: MessageName<A>;
		onGotPointerCaptureCapture?: MessageName<A>;
		onLostPointerCapture?: MessageName<A>;
		onLostPointerCaptureCapture?: MessageName<A>;

		// UI Events
		onScroll?: MessageName<A>;
		onScrollCapture?: MessageName<A>;

		// Wheel Events
		onWheel?: MessageName<A>;
		onWheelCapture?: MessageName<A>;

		// Animation Events
		onAnimationStart?: MessageName<A>;
		onAnimationStartCapture?: MessageName<A>;
		onAnimationEnd?: MessageName<A>;
		onAnimationEndCapture?: MessageName<A>;
		onAnimationIteration?: MessageName<A>;
		onAnimationIterationCapture?: MessageName<A>;

		// Transition Events
		onTransitionEnd?: MessageName<A>;
		onTransitionEndCapture?: MessageName<A>;
	}

	export interface HTMLAttributes<A extends ViewActor = ViewActor> extends Attributes, DOMAttributes<A> {
		// Standard HTML Attributes
		accept?: string;
		acceptCharset?: string;
		accessKey?: string;
		action?: string;
		allow?: string;
		allowFullScreen?: boolean;
		allowTransparency?: boolean;
		alt?: string;
		as?: string;
		async?: boolean;
		autocomplete?: string;
		autoComplete?: string;
		autocorrect?: string;
		autoCorrect?: string;
		autofocus?: boolean;
		autoFocus?: boolean;
		autoPlay?: boolean;
		capture?: boolean | string;
		cellPadding?: number | string;
		cellSpacing?: number | string;
		charSet?: string;
		challenge?: string;
		checked?: boolean;
		cite?: string;
		class?: string | undefined;
		className?: string | undefined;
		cols?: number;
		colSpan?: number;
		content?: string;
		contentEditable?: boolean;
		contextMenu?: string;
		controls?: boolean;
		controlsList?: string;
		coords?: string;
		crossOrigin?: string;
		data?: string;
		dateTime?: string;
		datetime?: string;
		default?: boolean;
		defaultChecked?: boolean;
		defaultValue?: string;
		defer?: boolean;
		dir?: 'auto' | 'rtl' | 'ltr';
		disabled?: boolean;
		disableRemotePlayback?: boolean;
		download?: any;
		decoding?: 'sync' | 'async' | 'auto';
		draggable?: boolean;
		encType?: string;
		enterkeyhint?:
			| 'enter'
			| 'done'
			| 'go'
			| 'next'
			| 'previous'
			| 'search'
			| 'send';
		form?: string;
		formAction?: string;
		formEncType?: string;
		formMethod?: string;
		formNoValidate?: boolean;
		formTarget?: string;
		frameBorder?: number | string;
		headers?: string;
		height?: number | string;
		hidden?: boolean;
		high?: number;
		href?: string;
		hrefLang?: string;
		for?: string;
		htmlFor?: string;
		httpEquiv?: string;
		icon?: string;
		id?: string;
		inputMode?: string;
		integrity?: string;
		is?: string;
		keyParams?: string;
		keyType?: string;
		kind?: string;
		label?: string;
		lang?: string;
		list?: string;
		loading?: 'eager' | 'lazy';
		loop?: boolean;
		low?: number;
		manifest?: string;
		marginHeight?: number;
		marginWidth?: number;
		max?: number | string;
		maxLength?: number;
		media?: string;
		mediaGroup?: string;
		method?: string;
		min?: number | string;
		minLength?: number;
		multiple?: boolean;
		muted?: boolean;
		name?: string;
		nomodule?: boolean;
		nonce?: string;
		noValidate?: boolean;
		open?: boolean;
		optimum?: number;
		part?: string;
		pattern?: string;
		ping?: string;
		placeholder?: string;
		playsInline?: boolean;
		poster?: string;
		preload?: string;
		radioGroup?: string;
		readonly?: boolean;
		readOnly?: boolean;
		referrerpolicy?:
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url';
		rel?: string;
		required?: boolean;
		reversed?: boolean;
		role?: string;
		rows?: number;
		rowSpan?: number;
		sandbox?: string;
		scope?: string;
		scoped?: boolean;
		scrolling?: string;
		seamless?: boolean;
		selected?: boolean;
		shape?: string;
		size?: number;
		sizes?: string;
		slot?: string;
		span?: number;
		spellcheck?: boolean;
		spellCheck?: boolean;
		src?: string;
		srcset?: string;
		srcDoc?: string;
		srcLang?: string;
		srcSet?: string;
		start?: number;
		step?: number | string;
		style?: string | CSSProperties;
		summary?: string;
		tabIndex?: number;
		tabindex?: string;
		target?: string;
		title?: string;
		type?: string;
		useMap?: string;
		value?: string | string[] | number;
		volume?: string | number;
		width?: number | string;
		wmode?: string;
		wrap?: string;

		// Non-standard Attributes
		autocapitalize?:
			| 'off'
			| 'none'
			| 'on'
			| 'sentences'
			| 'words'
			| 'characters';
		autoCapitalize?:
			| 'off'
			| 'none'
			| 'on'
			| 'sentences'
			| 'words'
			| 'characters';
		disablePictureInPicture?: boolean;
		results?: number;
		translate?: 'yes' | 'no';

		// RDFa Attributes
		about?: string;
		datatype?: string;
		inlist?: any;
		prefix?: string;
		property?: string;
		resource?: string;
		typeof?: string;
		vocab?: string;

		// Microdata Attributes
		itemProp?: string;
		itemScope?: boolean;
		itemType?: string;
		itemID?: string;
		itemRef?: string;
	}

	export type DetailedHTMLProps<
		HA extends HTMLAttributes<ViewActor>,
	> = HA;

	export interface HTMLMarqueeElement extends HTMLElement {
		behavior?: 'scroll' | 'slide' | 'alternate';
		bgColor?: string;
		direction?: 'left' | 'right' | 'up' | 'down';
		height?: number | string;
		hspace?: number | string;
		loop?: number | string;
		scrollAmount?: number | string;
		scrollDelay?: number | string;
		trueSpeed?: boolean;
		vspace?: number | string;
		width?: number | string;
	}

	type CustomElementAttributes = HTMLAttributes<ViewActor> & { [k: string]: unknown; };

  export interface BaseIntrinsicElements<A extends ViewActor> {
    [k: string]: CustomElementAttributes | HTMLAttributes<A> | SVGAttributes;
  }

	export interface IntrinsicElements<A extends ViewActor> extends BaseIntrinsicElements<A> {
		// HTML
		a: HTMLAttributes<A>;
		abbr: HTMLAttributes<A>;
		address: HTMLAttributes<A>;
		area: HTMLAttributes<A>;
		article: HTMLAttributes<A>;
		aside: HTMLAttributes<A>;
		audio: HTMLAttributes<A>;
		b: HTMLAttributes<A>;
		base: HTMLAttributes<A>;
		bdi: HTMLAttributes<A>;
		bdo: HTMLAttributes<A>;
		big: HTMLAttributes<A>;
		blockquote: HTMLAttributes<A>;
		body: HTMLAttributes<A>;
		br: HTMLAttributes<A>;
		button: HTMLAttributes<A>;
		canvas: HTMLAttributes<A>;
		caption: HTMLAttributes<A>;
		cite: HTMLAttributes<A>;
		code: HTMLAttributes<A>;
		col: HTMLAttributes<A>;
		colgroup: HTMLAttributes<A>;
		data: HTMLAttributes<A>;
		datalist: HTMLAttributes<A>;
		dd: HTMLAttributes<A>;
		del: HTMLAttributes<A>;
		details: HTMLAttributes<A>;
		dfn: HTMLAttributes<A>;
		dialog: HTMLAttributes<A>;
		div: HTMLAttributes<A>;
		dl: HTMLAttributes<A>;
		dt: HTMLAttributes<A>;
		em: HTMLAttributes<A>;
		embed: HTMLAttributes<A>;
		fieldset: HTMLAttributes<A>;
		figcaption: HTMLAttributes<A>;
		figure: HTMLAttributes<A>;
		footer: HTMLAttributes<A>;
		form: HTMLAttributes<A>;
		h1: HTMLAttributes<A>;
		h2: HTMLAttributes<A>;
		h3: HTMLAttributes<A>;
		h4: HTMLAttributes<A>;
		h5: HTMLAttributes<A>;
		h6: HTMLAttributes<A>;
		head: HTMLAttributes<A>;
		header: HTMLAttributes<A>;
		hgroup: HTMLAttributes<A>;
		hr: HTMLAttributes<A>;
		html: HTMLAttributes<A>;
		i: HTMLAttributes<A>;
		iframe: HTMLAttributes<A>;
		img: HTMLAttributes<A>;
		input: HTMLAttributes<A> & { defaultValue?: string };
		ins: HTMLAttributes<A>;
		kbd: HTMLAttributes<A>;
		keygen: HTMLAttributes<A>;
		label: HTMLAttributes<A>;
		legend: HTMLAttributes<A>;
		li: HTMLAttributes<A>;
		link: HTMLAttributes<A>;
		main: HTMLAttributes<A>;
		map: HTMLAttributes<A>;
		mark: HTMLAttributes<A>;
		marquee: HTMLAttributes<A>;
		menu: HTMLAttributes<A>;
		menuitem: HTMLAttributes<A>;
		meta: HTMLAttributes<A>;
		meter: HTMLAttributes<A>;
		nav: HTMLAttributes<A>;
		noscript: HTMLAttributes<A>;
		object: HTMLAttributes<A>;
		ol: HTMLAttributes<A>;
		optgroup: HTMLAttributes<A>;
		option: HTMLAttributes<A>;
		output: HTMLAttributes<A>;
		p: HTMLAttributes<A>;
		param: HTMLAttributes<A>;
		picture: HTMLAttributes<A>;
		pre: HTMLAttributes<A>;
		progress: HTMLAttributes<A>;
		q: HTMLAttributes<A>;
		rp: HTMLAttributes<A>;
		rt: HTMLAttributes<A>;
		ruby: HTMLAttributes<A>;
		s: HTMLAttributes<A>;
		samp: HTMLAttributes<A>;
		script: HTMLAttributes<A>;
		section: HTMLAttributes<A>;
		select: HTMLAttributes<A>;
		slot: HTMLAttributes<A>;
		small: HTMLAttributes<A>;
		source: HTMLAttributes<A>;
		span: HTMLAttributes<A>;
		strong: HTMLAttributes<A>;
		style: HTMLAttributes<A>;
		sub: HTMLAttributes<A>;
		summary: HTMLAttributes<A>;
		sup: HTMLAttributes<A>;
		table: HTMLAttributes<A>;
		tbody: HTMLAttributes<A>;
		td: HTMLAttributes<A>;
		textarea: HTMLAttributes<A>;
		tfoot: HTMLAttributes<A>;
		th: HTMLAttributes<A>;
		thead: HTMLAttributes<A>;
		time: HTMLAttributes<A>;
		title: HTMLAttributes<A>;
		tr: HTMLAttributes<A>;
		track: HTMLAttributes<A>;
		u: HTMLAttributes<A>;
		ul: HTMLAttributes<A>;
		var: HTMLAttributes<A>;
		video: HTMLAttributes<A>;
		wbr: HTMLAttributes<A>;

		//SVG
		svg: SVGAttributes<A>;
		animate: SVGAttributes<A>;
		circle: SVGAttributes<A>;
		animateTransform: SVGAttributes<A>;
		clipPath: SVGAttributes<A>;
		defs: SVGAttributes<A>;
		desc: SVGAttributes<A>;
		ellipse: SVGAttributes<A>;
		feBlend: SVGAttributes<A>;
		feColorMatrix: SVGAttributes<A>;
		feComponentTransfer: SVGAttributes<A>;
		feComposite: SVGAttributes<A>;
		feConvolveMatrix: SVGAttributes<A>;
		feDiffuseLighting: SVGAttributes<A>;
		feDisplacementMap: SVGAttributes<A>;
		feDropShadow: SVGAttributes<A>;
		feFlood: SVGAttributes<A>;
		feFuncA: SVGAttributes<A>;
		feFuncB: SVGAttributes<A>;
		feFuncG: SVGAttributes<A>;
		feFuncR: SVGAttributes<A>;
		feGaussianBlur: SVGAttributes<A>;
		feImage: SVGAttributes<A>;
		feMerge: SVGAttributes<A>;
		feMergeNode: SVGAttributes<A>;
		feMorphology: SVGAttributes<A>;
		feOffset: SVGAttributes<A>;
		feSpecularLighting: SVGAttributes<A>;
		feTile: SVGAttributes<A>;
		feTurbulence: SVGAttributes<A>;
		filter: SVGAttributes<A>;
		foreignObject: SVGAttributes<A>;
		g: SVGAttributes<A>;
		image: SVGAttributes<A>;
		line: SVGAttributes<A>;
		linearGradient: SVGAttributes<A>;
		marker: SVGAttributes<A>;
		mask: SVGAttributes<A>;
		path: SVGAttributes<A>;
		pattern: SVGAttributes<A>;
		polygon: SVGAttributes<A>;
		polyline: SVGAttributes<A>;
		radialGradient: SVGAttributes<A>;
		rect: SVGAttributes<A>;
		stop: SVGAttributes<A>;
		symbol: SVGAttributes<A>;
		text: SVGAttributes<A>;
		textPath: SVGAttributes<A>;
		tspan: SVGAttributes<A>;
		use: SVGAttributes<A>;
	}
}