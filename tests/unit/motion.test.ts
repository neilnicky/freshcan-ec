import { describe, expect, it } from "vitest";
import { buildKeys, levelToMl, mixPose, poseAt, sceneProgress, type Marks, type Pose } from "@/motion/track";
import { segmentDistance } from "@/motion/geometry";

const marks: Marks = { vh: 900, sceneTop: 900, sceneHeight: 3060, breakTop: 3960, breakHeight: 1080 };

describe("can track", () => {
  const keys = buildKeys(marks, false);

  it("keys are in scroll order", () => {
    for (let i = 1; i < keys.length; i++) expect(keys[i]!.at).toBeGreaterThanOrEqual(keys[i - 1]!.at);
  });

  it("starts full and centred in the hero", () => {
    const p = poseAt(keys, 0);
    expect(p.level).toBe(1);
    expect(p.x).toBe(0);
    expect(p.opacity).toBe(1);
  });

  it("drains in the first part of the scene and is full again by the end", () => {
    const travel = marks.sceneHeight - marks.vh;
    expect(poseAt(keys, marks.sceneTop + travel * 0.27).level).toBe(0);
    expect(poseAt(keys, marks.sceneTop + travel).level).toBe(1);
  });

  it("is gone after the break", () => {
    expect(poseAt(keys, marks.breakTop + marks.breakHeight + 10).opacity).toBe(0);
  });

  it("faces front (whole turns) when full and at the break", () => {
    const travel = marks.sceneHeight - marks.vh;
    const full = poseAt(keys, marks.sceneTop + travel * 0.78).spin;
    expect(Math.abs(full % (Math.PI * 2))).toBeLessThan(1e-9);
  });

  it("stays centred on compact screens", () => {
    buildKeys(marks, true).forEach((k) => expect(k.pose.x).toBe(0));
  });

  it("interpolates continuously between keys", () => {
    const a = poseAt(keys, 400);
    const b = poseAt(keys, 401);
    expect(Math.abs(a.scale - b.scale)).toBeLessThan(0.01);
  });

  it("mixPose returns endpoints at 0 and 1", () => {
    const a: Pose = { x: 0, y: 0, scale: 1, spin: 0, tilt: 0, level: 0, opacity: 1 };
    const b: Pose = { x: 1, y: 1, scale: 2, spin: 3, tilt: 1, level: 1, opacity: 0 };
    expect(mixPose(a, b, 0)).toEqual(a);
    expect(mixPose(a, b, 1)).toEqual(b);
  });

  it("scene progress is clamped", () => {
    expect(sceneProgress(marks, 0)).toBe(0);
    expect(sceneProgress(marks, 1e6)).toBe(1);
    expect(sceneProgress(marks, marks.sceneTop + (marks.sceneHeight - marks.vh) / 2)).toBeCloseTo(0.5);
  });

  it("converts level to millilitres", () => {
    expect(levelToMl(0, 330)).toBe(0);
    expect(levelToMl(0.5, 330)).toBe(165);
    expect(levelToMl(2, 330)).toBe(330);
  });
});

describe("game geometry", () => {
  it("measures segment to point distance", () => {
    expect(segmentDistance(0, 0, 10, 0, 5, 3)).toBeCloseTo(3);
    expect(segmentDistance(0, 0, 10, 0, -4, 3)).toBeCloseTo(5);
    expect(segmentDistance(2, 2, 2, 2, 5, 6)).toBeCloseTo(5);
  });
});
