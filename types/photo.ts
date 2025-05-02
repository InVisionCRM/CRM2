export enum PhotoStage {
  Before = "Before",
  During = "During",
  After = "After",
}

export type CameraFacing = "user" | "environment"

export interface PhotoData {
  name: string
  dataUrl: string
  stage: PhotoStage
  annotations?: string
  createdAt: Date
  leadId?: string
}
