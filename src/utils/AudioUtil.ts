/**
 * 音频分割选项接口
 */
export interface AudioBufferSplitOptions {
  /** 目标片段时长(毫秒)，默认 60000ms (1分钟) */
  targetDurationMs?: number
  /** 最小片段时长(毫秒)，默认 45000ms (45秒) */
  minDurationMs?: number
  /** 最大片段时长(毫秒)，默认 75000ms (75秒) */
  maxDurationMs?: number
  /** 静音阈值(0-1之间)，默认值为 null 表示自动计算 */
  silenceThreshold?: number | null
  /** 当自动计算阈值时的乘数因子，默认 1.5 */
  silenceMultiplier?: number
  /** 最小静音持续时间(毫秒)，默认 500ms */
  minSilenceDurationMs?: number
  /** 如果找不到合适的停顿点是否强制分割，默认 true */
  forceSegmentation?: boolean
  /** 是否使用自适应阈值，默认 true */
  adaptiveThreshold?: boolean
}

/**
 * 静音区间信息，包含 [开始索引, 结束索引, 静音强度]
 */
type SilenceRange = [number, number, number]

/**
 * 将音频分割成大约 1 分钟长的片段，优先在说话人停顿处分割
 * @param audioBuffer - 输入的音频缓冲区
 * @param options - 配置选项
 * @returns 分割后的音频片段数组
 */
export function splitAudioBuffer(
  audioBuffer: AudioBuffer,
  options: AudioBufferSplitOptions = {}
): Float32Array[] {
  // 默认参数
  const {
    targetDurationMs = 60000, // 1分钟
    minDurationMs = 45000, // 45秒
    maxDurationMs = 75000, // 75秒
    silenceThreshold = null, // 静音阈值，null表示自动计算
    silenceMultiplier = 1.5, // 噪声基线乘数，用于自动计算阈值
    minSilenceDurationMs = 500, // 最小静音持续时间
    forceSegmentation = true, // 是否强制分割
    adaptiveThreshold = true, // 是否使用自适应阈值
  } = options

  // 获取音频数据
  const sampleRate: number = audioBuffer.sampleRate
  const channelData: Float32Array = audioBuffer.getChannelData(0) // 获取第一个声道

  // 如果没有提供静音阈值，则自动计算
  let effectiveThreshold: number = silenceThreshold ?? 0
  if (silenceThreshold === null || adaptiveThreshold) {
    effectiveThreshold = calculateDynamicThreshold(
      channelData,
      silenceMultiplier
    )
  }

  // 将毫秒转换为采样点数
  const targetDurationSamples: number = Math.floor(
    (targetDurationMs * sampleRate) / 1000
  )
  const minDurationSamples: number = Math.floor(
    (minDurationMs * sampleRate) / 1000
  )
  const maxDurationSamples: number = Math.floor(
    (maxDurationMs * sampleRate) / 1000
  )
  const minSilenceDurationSamples: number = Math.floor(
    (minSilenceDurationMs * sampleRate) / 1000
  )

  // 存储分割结果
  const segments: Float32Array[] = []

  // 如果音频总长度小于最小分割长度，直接返回整个音频
  if (channelData.length <= minDurationSamples) {
    return [channelData]
  }

  // 查找静音段落
  // 这将存储可能的分割点 [开始点, 结束点, 静音强度]
  const silenceRanges: SilenceRange[] = findSilenceRanges(
    channelData,
    effectiveThreshold,
    minSilenceDurationSamples,
    adaptiveThreshold
  )

  // 开始分割
  let startPos: number = 0

  while (startPos < channelData.length) {
    // 计算当前位置与目标分割长度
    const currentTargetEndPos: number = startPos + targetDurationSamples

    // 如果剩余音频长度已小于最小分割长度，加入最后一段并结束
    if (channelData.length - startPos <= maxDurationSamples) {
      const finalSegment: Float32Array = new Float32Array(
        channelData.length - startPos
      )
      finalSegment.set(channelData.subarray(startPos))
      segments.push(finalSegment)
      break
    }

    // 在目标范围内查找最佳分割点
    let bestSplitPos: number = -1
    let bestScore: number = -Infinity

    // 查找位于 minDurationSamples 和 maxDurationSamples 范围内的静音点
    const validRangeStart: number = startPos + minDurationSamples
    const validRangeEnd: number = startPos + maxDurationSamples

    // 在所有静音区间中寻找最佳的分割点
    for (const [silenceStart, silenceEnd, silenceIntensity] of silenceRanges) {
      // 只考虑在有效范围内的静音点
      if (silenceEnd <= validRangeStart || silenceStart >= validRangeEnd) {
        continue
      }

      // 计算静音区间中点
      const silenceMidpoint: number = Math.floor(
        (silenceStart + silenceEnd) / 2
      )

      // 如果静音点不在有效范围内，跳过
      if (
        silenceMidpoint < validRangeStart ||
        silenceMidpoint > validRangeEnd
      ) {
        continue
      }

      // 计算分数: 静音强度 + 接近目标时长的程度
      const distanceFromTarget: number = Math.abs(
        silenceMidpoint - currentTargetEndPos
      )
      const proximityScore: number =
        1 - distanceFromTarget / targetDurationSamples
      const score: number = silenceIntensity * 0.7 + proximityScore * 0.3 // 权重可调整

      if (score > bestScore) {
        bestScore = score
        bestSplitPos = silenceMidpoint
      }
    }

    // 如果找不到合适的分割点且允许强制分割
    if (bestSplitPos === -1 && forceSegmentation) {
      // 尝试接近目标时长的点
      bestSplitPos = Math.min(currentTargetEndPos, channelData.length)
    }

    // 如果找到了分割点（或强制分割）
    if (bestSplitPos !== -1) {
      // 创建此段的数据
      const segmentLength: number = bestSplitPos - startPos
      const segment: Float32Array = new Float32Array(segmentLength)
      segment.set(channelData.subarray(startPos, bestSplitPos))
      segments.push(segment)

      // 更新起始位置
      startPos = bestSplitPos
    } else {
      // 如果不允许强制分割且找不到合适的点，将剩余所有数据作为最后一段
      const finalSegment: Float32Array = new Float32Array(
        channelData.length - startPos
      )
      finalSegment.set(channelData.subarray(startPos))
      segments.push(finalSegment)
      break
    }
  }

  return segments
}

/**
 * 计算动态静音阈值
 * @param audioData - 音频数据
 * @param multiplier - 基线乘数系数
 * @returns 计算出的阈值
 */
function calculateDynamicThreshold(
  audioData: Float32Array,
  multiplier: number = 1.5
): number {
  // 分块计算能量分布，以识别背景噪声水平
  const chunkSize: number = 16384 // 较大的块以捕获足够的背景噪声
  const chunkCount: number = Math.ceil(audioData.length / chunkSize)
  const chunkEnergies: number[] = []

  for (let i = 0; i < chunkCount; i++) {
    const start: number = i * chunkSize
    const end: number = Math.min(start + chunkSize, audioData.length)

    // 计算RMS能量
    let sumSquared: number = 0
    for (let j = start; j < end; j++) {
      sumSquared += audioData[j] * audioData[j]
    }

    const rms: number = Math.sqrt(sumSquared / (end - start))
    chunkEnergies.push(rms)
  }

  // 排序能量值
  chunkEnergies.sort((a, b) => a - b)

  // 使用下四分位数作为背景噪声估计 (更稳健的方法)
  const lowerQuartileIndex: number = Math.floor(chunkEnergies.length * 0.25)
  const backgroundNoise: number = chunkEnergies[lowerQuartileIndex]

  // 将阈值设为背景噪声的倍数
  return backgroundNoise * multiplier
}

/**
 * 查找音频中的静音区间
 * @param audioData - 音频数据
 * @param baseThreshold - 基础静音阈值
 * @param minSilenceSamples - 最小静音持续采样点数
 * @param adaptive - 是否使用局部自适应阈值
 * @returns 静音区间数组，每项为 [开始索引, 结束索引, 静音强度]
 */
function findSilenceRanges(
  audioData: Float32Array,
  baseThreshold: number,
  minSilenceSamples: number,
  adaptive: boolean = true
): SilenceRange[] {
  const silenceRanges: SilenceRange[] = []
  let inSilence: boolean = false
  let silenceStart: number = 0
  let silenceSum: number = 0 // 用于计算静音强度
  let consecutiveSilenceSamples: number = 0

  // 对音频数据进行滑动窗口处理，减少采样点级别的波动影响
  const windowSize: number = 1024 // 约23ms@44.1kHz
  const stepSize: number = 256 // 窗口滑动步长

  // 如果启用自适应阈值，预计算局部能量水平
  let localThresholds: Float32Array | null = null

  if (adaptive) {
    localThresholds = calculateLocalThresholds(
      audioData,
      windowSize,
      stepSize,
      baseThreshold
    )
  }

  for (let i = 0; i < audioData.length; i += stepSize) {
    // 计算当前窗口的能量
    let windowEnergy: number = 0
    const end: number = Math.min(i + windowSize, audioData.length)
    const windowLength: number = end - i

    for (let j = i; j < end; j++) {
      windowEnergy += Math.abs(audioData[j])
    }

    // 归一化能量
    const avgEnergy: number = windowEnergy / windowLength

    // 获取适用于当前位置的阈值
    const currentThreshold: number =
      adaptive && localThresholds
        ? localThresholds[Math.floor(i / stepSize)]
        : baseThreshold

    // 检测是否为静音
    const isSilent: boolean = avgEnergy < currentThreshold

    if (isSilent) {
      if (!inSilence) {
        // 进入静音
        inSilence = true
        silenceStart = i
        silenceSum = 0
        consecutiveSilenceSamples = 0
      }

      // 累计静音样本数和强度
      consecutiveSilenceSamples += stepSize
      silenceSum += currentThreshold - avgEnergy // 静音程度，越小越安静
    } else if (inSilence) {
      // 静音结束
      if (consecutiveSilenceSamples >= minSilenceSamples) {
        // 计算平均静音强度 (0-1 之间，越大表示越安静)
        const silenceIntensity: number =
          silenceSum / (consecutiveSilenceSamples / stepSize)
        silenceRanges.push([silenceStart, i, silenceIntensity])
      }

      inSilence = false
    }
  }

  // 如果音频结束时仍在静音状态
  if (inSilence && consecutiveSilenceSamples >= minSilenceSamples) {
    const silenceIntensity: number =
      silenceSum / (consecutiveSilenceSamples / stepSize)
    silenceRanges.push([silenceStart, audioData.length, silenceIntensity])
  }

  return silenceRanges
}

/**
 * 计算局部自适应阈值
 * @param audioData - 音频数据
 * @param windowSize - 窗口大小
 * @param stepSize - 步长
 * @param baseThreshold - 基础阈值
 * @returns 每个窗口位置的阈值
 */
function calculateLocalThresholds(
  audioData: Float32Array,
  windowSize: number,
  stepSize: number,
  baseThreshold: number
): Float32Array {
  const windowCount: number = Math.ceil(audioData.length / stepSize)
  const energies: Float32Array = new Float32Array(windowCount)
  const thresholds: Float32Array = new Float32Array(windowCount)

  // 首先计算每个窗口的能量
  for (let i = 0; i < windowCount; i++) {
    const start: number = i * stepSize
    const end: number = Math.min(start + windowSize, audioData.length)
    let sum: number = 0

    for (let j = start; j < end; j++) {
      sum += Math.abs(audioData[j])
    }

    energies[i] = sum / (end - start)
  }

  // 使用滑动窗口平均进行平滑处理
  const smoothingWindow: number = 20 // 约500ms@44.1kHz

  for (let i = 0; i < windowCount; i++) {
    const windowStart: number = Math.max(0, i - smoothingWindow)
    const windowEnd: number = Math.min(windowCount, i + smoothingWindow + 1)
    let minEnergy: number = Infinity
    let maxEnergy: number = 0

    // 计算局部能量统计
    for (let j = windowStart; j < windowEnd; j++) {
      minEnergy = Math.min(minEnergy, energies[j])
      maxEnergy = Math.max(maxEnergy, energies[j])
    }

    const energyRange: number = maxEnergy - minEnergy

    // 动态自适应阈值计算
    // 1. 如果能量范围很小，表示这是一个比较平稳的区域，使用较低的阈值
    // 2. 如果能量范围大，表示这是一个变化剧烈的区域，使用较高的阈值
    const dynamicComponent: number = minEnergy + energyRange * 0.3 // 局部噪声水平 + 一部分动态范围

    // 结合基础阈值和动态组件
    thresholds[i] = Math.max(baseThreshold * 0.7, dynamicComponent)
  }

  return thresholds
}
