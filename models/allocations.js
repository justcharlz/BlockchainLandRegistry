const { Schema, model } = require('mongoose')

const AllocationStatus = Object.freeze({
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  INPROGRESS: 'Ongoing',
  TERMINATED: 'Terminated',
  PENDING: 'Pending',
})

const AllocationSchema = new Schema(
  {
    scheduleId: { type: Schema.ObjectId, ref: 'Schedules', select: true },
    username: { type: Schema.Types.String, select: true, dropDups: true },
    amount: { type: Schema.Types.String ,  select: true},
    name: { type: Schema.Types.String ,  select: true},
    status: {
      type: Schema.Types.String, enum: Object.values(AllocationStatus), default: AllocationStatus.PENDING, required: true
    },
    comment: { type: Schema.Types.String ,  select: true},
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

AllocationSchema.statics.Status = AllocationStatus

const Allocations = model('Allocations', AllocationSchema)

exports.AllocationModel = Allocations
