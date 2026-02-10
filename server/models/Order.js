import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    customer: { type: String, required: true },
    product: { type: String, required: true },
  },
  { timestamps: true }
)

const Order = mongoose.model('Order', orderSchema)

export default Order
