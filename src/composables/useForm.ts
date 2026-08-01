/**
 * 表单逻辑组合式函数
 */

import { ref, reactive, toRaw } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

export interface UseFormOptions<T = any> {
  initialValues?: Partial<T>
  rules?: FormRules
  onSubmit?: (values: T) => Promise<void> | void
  onReset?: () => void
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T> = {}) {
  const { initialValues = {}, rules = {}, onSubmit, onReset } = options

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const formData = reactive<T>({ ...initialValues } as T)

  // 验证表单
  const validate = async (): Promise<boolean> => {
    if (!formRef.value) return false

    try {
      await formRef.value.validate()
      return true
    } catch {
      return false
    }
  }

  // 验证字段
  const validateField = async (field: string): Promise<boolean> => {
    if (!formRef.value) return false

    try {
      await formRef.value.validateField(field)
      return true
    } catch {
      return false
    }
  }

  // 重置表单
  const resetForm = () => {
    if (formRef.value) {
      formRef.value.resetFields()
    }
    Object.assign(formData, initialValues)
    onReset?.()
  }

  // 清空验证
  const clearValidate = (fields?: string | string[]) => {
    if (formRef.value) {
      formRef.value.clearValidate(fields)
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    const isValid = await validate()
    if (!isValid) return

    loading.value = true
    try {
      await onSubmit?.(getFormData())
    } catch (error) {
      console.error('表单提交失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 设置表单值
  const setFormData = (data: Partial<T>) => {
    Object.assign(formData, data)
  }

  // 获取表单值
  const getFormData = (): T => {
    return { ...(toRaw(formData) as T) }
  }

  return {
    formRef,
    loading,
    formData,
    rules,
    validate,
    validateField,
    resetForm,
    clearValidate,
    handleSubmit,
    setFormData,
    getFormData
  }
}
