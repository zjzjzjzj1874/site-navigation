package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// 创建 gin 实例
	r := gin.Default()

	// 设置静态文件目录
	r.Static("/static", "./static")
	// 加载HTML模板
	r.LoadHTMLGlob("templates/*")

	// API 路由
	api := r.Group("/api")
	{
		api.GET("/sites", getSites)
		api.POST("/sites", addSite)
		api.PUT("/sites/:id", updateSite)
		api.DELETE("/sites/:id", deleteSite)
		api.GET("/search", searchSites)
		api.GET("/modules", getModules)
		api.GET("/modules/types", getModuleTypes) // 新增获取模块类型配置的API
	}

	// 前端页面路由
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	// 启动服务器
	if err := r.Run(":44399"); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}

// 获取所有站点
func getSites(c *gin.Context) {
	sites, err := loadSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sites)
}

// 添加新站点
func addSite(c *gin.Context) {
	var site Site
	if err := c.ShouldBindJSON(&site); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sites, err := loadSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 生成新的ID
	site.ID = generateID()
	sites = append(sites, site)

	if err := saveSites(sites); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, site)
}

// 更新站点
func updateSite(c *gin.Context) {
	id := c.Param("id")
	var updatedSite Site
	if err := c.ShouldBindJSON(&updatedSite); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sites, err := loadSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	siteIndex := -1
	for i, site := range sites {
		if site.ID == id {
			siteIndex = i
			break
		}
	}

	if siteIndex == -1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Site not found"})
		return
	}

	// 保持原有ID和其他字段，只更新传入的字段
	if updatedSite.Sort != 0 {
		sites[siteIndex].Sort = updatedSite.Sort
	}
	if updatedSite.Name != "" {
		sites[siteIndex].Name = updatedSite.Name
	}
	if updatedSite.URL != "" {
		sites[siteIndex].URL = updatedSite.URL
	}
	if updatedSite.Description != "" {
		sites[siteIndex].Description = updatedSite.Description
	}
	if updatedSite.Module != "" {
		sites[siteIndex].Module = updatedSite.Module
	}
	if updatedSite.Icon != "" {
		sites[siteIndex].Icon = updatedSite.Icon
	}
	if updatedSite.Host != "" {
		sites[siteIndex].Host = updatedSite.Host
	}

	if err := saveSites(sites); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sites[siteIndex])
}

// 删除站点
func deleteSite(c *gin.Context) {
	id := c.Param("id")

	sites, err := loadSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var newSites []Site
	for _, site := range sites {
		if site.ID != id {
			newSites = append(newSites, site)
		}
	}

	if err := saveSites(newSites); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Site deleted successfully"})
}

// 搜索站点
func searchSites(c *gin.Context) {
	query := c.Query("q")

	sites, err := loadSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var results []Site
	for _, site := range sites {
		if containsString(site.Name, query) || containsString(site.Description, query) || containsString(site.URL, query) {
			results = append(results, site)
		}
	}

	c.JSON(http.StatusOK, results)
}

// 获取所有模块类型
func getModules(c *gin.Context) {
	types, err := loadModuleTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	modules := make([]ModuleType, len(types))
	for i, t := range types {
		modules[i] = ModuleType(t.Key)
	}
	c.JSON(http.StatusOK, modules)
}

// 获取模块类型配置
func getModuleTypes(c *gin.Context) {
	types, err := loadModuleTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, types)
}
