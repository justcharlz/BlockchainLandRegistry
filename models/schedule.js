
const { Schema, model } = require('mongoose')
  
  
  const ScheduleType = Object.freeze({
    PAY_SCHEME: 'Pay Scheme',
    UPFRONT_SCHEME: 'Upfront Scheme'
  })

  const ScheduleStatus = Object.freeze({
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
    INPROGRESS: 'In Progress',
    PENDING: 'Pending Approval',
    APPROVED: 'Approved',
    TERMINATED: 'Terminated',
    APPROVING: 'Ongoing Approval'
  })
  
  const UserGroup = Object.freeze({
    ET: 'Executive Trainee',
    SE: 'Senior Executive',
    BO: 'Bank Officer',
    SBO: 'Senior Bank Officer',
    AM: 'Assistant Manager',
    DM: 'Deputy Manager',
    MGR: 'Manager',
    SM: 'Senior Manager',
    AGM: 'Assistant General Manager',
    DGM: 'Deputy General Manager',
    ED: 'Executive Director',
    MD: 'Managing Director'
  })

  const ScheduleSchema = new Schema({
    scheduleId: { type: Schema.Types.Number, unique: true, dropDups: true, select:true },
    windowId: { type: Schema.ObjectId, ref: 'TradingWindow', required: true, select: true },
    name: { type: Schema.Types.String, unique: true },
    description: { type: Schema.Types.String },
    type: { type: Schema.Types.String, enum: Object.values(ScheduleType), default: ScheduleType.PAY_SCHEME, required: true },
    status: {
      type: Schema.Types.String, enum: Object.values(ScheduleStatus), default: ScheduleStatus.PENDING, required: true
    },
    scheduleFile : { type: [
      { type: Schema.Types.String }
    ], required: true },
    volume : { type: Schema.Types.Number },
    approverActionTime : { type: Date,  select: true}
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } })
  
  ScheduleSchema.statics.Status = ScheduleStatus
  ScheduleSchema.statics.UserGroup = UserGroup 
  ScheduleSchema.statics.ScheduleType = ScheduleType 
  
  
  const Schedule = model('Schedules', ScheduleSchema)
  
exports.ScheduleModel = Schedule 
  