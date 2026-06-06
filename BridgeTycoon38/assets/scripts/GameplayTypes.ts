import { Color } from 'cc';

export enum BuildInvalidReason {
  None = 'None',
  Testing = 'Testing',
  OutOfBuildArea = 'OutOfBuildArea',
  TooShort = 'TooShort',
  TooLong = 'TooLong',
  DuplicateSegment = 'DuplicateSegment',
  SameNode = 'SameNode',
  NotEnoughBudget = 'NotEnoughBudget',
}

export interface BuildValidationResult {
  valid: boolean;
  warning: boolean;
  reason: BuildInvalidReason;
  message: string;
}

export enum FailureReason {
  None = 'None',
  DeckNotConnected = 'DeckNotConnected',
  DeckSinkTooMuch = 'DeckSinkTooMuch',
  SegmentBroken = 'SegmentBroken',
  OverBudget = 'OverBudget',
  VehicleNotPassed = 'VehicleNotPassed',
  VehicleFell = 'VehicleFell',
}

export interface TestResult {
  success: boolean;
  failureReason: FailureReason;
  breakCount: number;
  usedCost: number;
  budget: number;
  passedVehicleCount: number;
  totalVehicleCount: number;
  maxSink: number;
}

export interface GameplayConfig {
  buildPreview: {
    enabled: boolean;
    validColor: string;
    warningColor: string;
    invalidColor: string;
    lineWidth: number;
    minSegmentLength: number;
    maxSegmentLength: number;
    longSegmentWarningLength: number;
  };
  snap: {
    enabled: boolean;
    snapRadius: number;
    anchorSnapRadius: number;
    showSnapHighlight: boolean;
    highlightColor: string;
  };
  stressVisual: {
    enabled: boolean;
    normalColor: string;
    lowStressColor: string;
    highStressColor: string;
    dangerColor: string;
    brokenColor: string;
    lowThreshold: number;
    highThreshold: number;
    dangerThreshold: number;
  };
  deckFeedback: {
    enabled: boolean;
    carSink: number;
    truckSink: number;
    busSink: number;
    heavyTruckSink: number;
    recoverSpeed: number;
    shakeOnDanger: boolean;
    shakeAmplitude: number;
  };
}

export function colorFromHex(hex: string, alpha = 255): Color {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) {
    return new Color(255, 255, 255, alpha);
  }
  return new Color((value >> 16) & 255, (value >> 8) & 255, value & 255, alpha);
}
