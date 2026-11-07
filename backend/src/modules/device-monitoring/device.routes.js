import express from "express";

import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.js";

import {
  validateDeviceRegistration,
  validateLocationUpdate,
} from "./device.validation.js";

import {
  registerDeviceController,
  getDevicesController,
  updateLocationController,
  getIpInfoController,
} from "./device.controller.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("CUSTOMER"));

router.post(
  "/register",
  validateDeviceRegistration,
  registerDeviceController
);

router.get(
  "/devices",
  getDevicesController
);

router.post(
  "/location",
  validateLocationUpdate,
  updateLocationController
);

router.get(
  "/ip-info",
  getIpInfoController
);

export default router;