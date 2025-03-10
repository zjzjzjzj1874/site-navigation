package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

// ModuleType 模块类型枚举
type ModuleType string

// ModuleTypeConfig 模块类型配置
type ModuleTypeConfig struct {
	Key         string `json:"key"`
	Value       string `json:"value"`
	Description string `json:"description"`
}

// DefaultModuleType 默认模块类型
const DefaultModuleType ModuleType = "通用网站"

// loadModuleTypes 从配置文件加载模块类型
func loadModuleTypes() ([]ModuleTypeConfig, error) {
	data, err := os.ReadFile("module_types.json")
	if err != nil {
		return nil, fmt.Errorf("读取模块类型配置文件失败: %v", err)
	}

	var types []ModuleTypeConfig
	if err := json.Unmarshal(data, &types); err != nil {
		return nil, fmt.Errorf("解析模块类型配置失败: %v", err)
	}

	return types, nil
}

// isValidModuleType 检查模块类型是否有效
func isValidModuleType(moduleType ModuleType) bool {
	types, err := loadModuleTypes()
	if err != nil {
		return false
	}

	for _, t := range types {
		if ModuleType(t.Key) == moduleType {
			return true
		}
	}
	return false
}

// Site 站点结构
type Site struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	URL         string     `json:"url"`
	Description string     `json:"description"`
	Module      ModuleType `json:"module"`
	Icon        string     `json:"icon"`
	Host        string     `json:"host"`
	Sort        int        `json:"sort"`
}

const sitesFile = "sites.json"

// loadSites 从文件加载站点数据
func loadSites() ([]Site, error) {
	if _, err := os.Stat(sitesFile); os.IsNotExist(err) {
		return []Site{}, nil
	}

	data, err := os.ReadFile(sitesFile)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %v", err)
	}

	var sites []Site
	if err := json.Unmarshal(data, &sites); err != nil {
		return nil, fmt.Errorf("解析JSON失败: %v", err)
	}

	return sites, nil
}

// saveSites 保存站点数据到文件
func saveSites(sites []Site) error {
	// 处理每个站点的图标URL，去除前后空格
	for i := range sites {
		sites[i].Icon = strings.TrimSpace(sites[i].Icon)
	}

	data, err := json.MarshalIndent(sites, "", "  ")
	if err != nil {
		return fmt.Errorf("生成JSON失败: %v", err)
	}

	if err := os.WriteFile(sitesFile, data, 0644); err != nil {
		return fmt.Errorf("写入文件失败: %v", err)
	}

	return nil
}

// generateID 生成唯一ID
func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// containsString 检查字符串是否包含子串（不区分大小写）
func containsString(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}
