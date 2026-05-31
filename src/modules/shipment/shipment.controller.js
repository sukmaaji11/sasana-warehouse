import * as shipmentService from './shipment.services.js';

export const createShipment = async (req, res) => {
  try {
    const shipment = await shipmentService.createShipment(req.body);

    res.status(201).json({
      message: 'Shipment berhasil dibuat',
      data: shipment,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const getShipments = async (req, res) => {
  try {
    const data = await shipmentService.getShipments();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getShipmentById = async (req, res) => {
  try {
    const data = await shipmentService.getShipmentById(req.params.id);

    if (!data) {
      return res.status(404).json({
        error: 'Shipment tidak ditemukan',
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const assignDriver = async (req, res) => {
  try {
    const data = await shipmentService.assignDriver(
      req.params.id,
      req.body.driverId,
    );

    res.json({
      message: 'Driver berhasil ditugaskan',
      data,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const pickupShipment = async (req, res) => {
  try {
    const data = await shipmentService.pickupShipment(req.params.id);

    res.json({
      message: 'Shipment berhasil dipickup',
      data,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const receiveShipment = async (req, res) => {
  try {
    const data = await shipmentService.receiveShipment(req.params.id);

    res.json({
      message: 'Shipment berhasil diterima',
      data,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
