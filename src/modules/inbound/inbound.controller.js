import * as inboundService from './inbound.services.js';

export const createInbound = async (req, res) => {
  try {
    const inbound = await inboundService.createInbound(req.body);

    res.status(201).json({
      message: 'Packaging inbound berhasil',
      data: inbound,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const data = await inboundService.getAll();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await inboundService.getById(req.params.id);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
